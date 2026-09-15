"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CircleCheck, FileText, ImagePlus, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { SchemaForm } from "@/components/forms/schema-form";
import { GradientButton } from "@/components/ui/gradient-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { countries } from "@/lib/content/countries";
import { DOCUMENT_MAX_BYTES, combinedSide, documentMimeTypes, documentSides } from "@/lib/document-rules";
import { notifyResult } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { submitBasicVerification, submitVerificationDocuments, uploadVerificationDocument } from "@/features/account/actions/account-actions";
import { basicVerificationSchema } from "@/features/account/schemas/account-schema";

const fields = [
  { name: "country", label: "Country / Region", type: "select", placeholder: "Select country", options: countries.map((country) => ({ value: country, label: country })) },
  { name: "fullName", label: "Full legal name", autoComplete: "name" },
  { name: "idNumber", label: "ID number", autoComplete: "off" },
  { name: "city", label: "City of residence", autoComplete: "address-level2" },
];

export const BasicVerificationForm = () => (
  <SchemaForm
    schema={basicVerificationSchema}
    action={submitBasicVerification}
    fields={fields}
    columns={2}
    defaultValues={{ country: "", fullName: "", idNumber: "", city: "" }}
    successMessage="Verification submitted for review."
    submitLabel="Submit Basic Verification"
    pendingLabel="Submitting…"
  />
);

const uploadedHint = (format, combined) => {
  if (combined) return "In your PDF · tap to replace this side";
  if (format === "pdf") return "PDF uploaded · tap to replace";
  return "Uploaded · tap to replace";
};

const UploadSlot = ({ side, preview, uploaded, combined, uploading, disabled, onFile }) => (
  <label
    className={cn(
      "relative flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed bg-field p-4 text-center transition-colors",
      uploaded ? "border-up/40" : "border-white/15 hover:border-brand/50",
      disabled && "pointer-events-none opacity-60",
    )}
  >
    <input type="file" accept={documentMimeTypes.join(",")} className="sr-only" disabled={disabled} onChange={onFile} />
    {preview && <Image src={preview} alt="" fill unoptimized className="object-cover opacity-40" />}
    <span className="relative flex flex-col items-center gap-2">
      {uploading ? <LoaderCircle className="size-6 animate-spin text-brand" /> : uploaded ? <CircleCheck className="size-6 text-up" /> : <ImagePlus className="size-6 text-neutral-500" strokeWidth={1.5} />}
      <span className="text-sm text-white">{side.label}</span>
      <span className="text-xs text-neutral-400">{uploading ? "Uploading…" : uploaded ? uploadedHint(uploaded, combined) : "JPG, PNG or PDF, up to 4 MB"}</span>
    </span>
  </label>
);

const CombinedUpload = ({ uploaded, uploading, disabled, onFile }) => (
  <label
    className={cn(
      "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-field px-4 py-3 transition-colors",
      uploaded ? "border-up/40" : "border-white/15 hover:border-brand/50",
      disabled && "pointer-events-none opacity-60",
    )}
  >
    <input type="file" accept="application/pdf" className="sr-only" disabled={disabled} onChange={onFile} />
    {uploading ? <LoaderCircle className="size-5 shrink-0 animate-spin text-brand" /> : uploaded ? <CircleCheck className="size-5 shrink-0 text-up" /> : <FileText className="size-5 shrink-0 text-neutral-500" strokeWidth={1.5} />}
    <span className="flex min-w-0 flex-col">
      <span className="text-sm text-white">Have one PDF with both sides?</span>
      <span className="text-xs text-neutral-400">{uploading ? "Uploading…" : uploaded ? "PDF uploaded for front and back · tap to replace" : "Upload it here instead, up to 4 MB"}</span>
    </span>
  </label>
);

export const DocumentUploadForm = ({ uploaded, combined }) => {
  const router = useRouter();
  const [previews, setPreviews] = useState({});
  const [uploading, setUploading] = useState(null);
  const [, startTransition] = useTransition();
  const previewsRef = useRef(previews);
  const submit = useActionSubmit({ action: submitVerificationDocuments, successMessage: "Documents submitted for review." });

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => () => Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url)), []);

  const handleFile = (side) => (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const both = side.value === combinedSide.value;
    if (both && file.type !== "application/pdf") return toast.error("Upload one PDF that shows both sides of your ID.");
    if (!documentMimeTypes.includes(file.type)) return toast.error("Upload a JPG, PNG or PDF file.");
    if (file.size > DOCUMENT_MAX_BYTES) return toast.error("Files must be 4 MB or smaller.");
    const formData = new FormData();
    formData.append("side", side.value);
    formData.append("file", file);
    setUploading(side.value);
    startTransition(async () => {
      try {
        const result = await uploadVerificationDocument(formData);
        notifyResult(result, `${side.label} uploaded.`);
        if (!result.ok) return;
        setPreviews((current) => {
          const replaced = both ? documentSides.map((item) => item.value) : [side.value];
          replaced.filter((key) => current[key]).forEach((key) => URL.revokeObjectURL(current[key]));
          const cleared = Object.fromEntries(Object.entries(current).filter(([key]) => !replaced.includes(key)));
          return file.type === "application/pdf" ? cleared : { ...cleared, [side.value]: URL.createObjectURL(file) };
        });
        router.refresh();
      } finally {
        setUploading(null);
      }
    });
  };

  const ready = documentSides.every((side) => uploaded[side.value]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {documentSides.map((side) => (
          <UploadSlot
            key={side.value}
            side={side}
            preview={previews[side.value]}
            uploaded={uploaded[side.value]}
            combined={combined}
            uploading={uploading === side.value}
            disabled={Boolean(uploading) || submit.pending}
            onFile={handleFile(side)}
          />
        ))}
      </div>
      <CombinedUpload uploaded={combined} uploading={uploading === combinedSide.value} disabled={Boolean(uploading) || submit.pending} onFile={handleFile(combinedSide)} />
      <p className="text-xs leading-5 text-neutral-500">Files are stored privately and only visible to the review team. Make sure all four corners and your details are readable.</p>
      <GradientButton onClick={() => submit.submit()} disabled={!ready || Boolean(uploading) || submit.pending} className="self-start">
        {submit.pending ? "Submitting…" : "Submit Documents"}
      </GradientButton>
    </div>
  );
};
