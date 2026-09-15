"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CircleCheck, ImagePlus, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { SchemaForm } from "@/components/forms/schema-form";
import { GradientButton } from "@/components/ui/gradient-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { countries } from "@/lib/content/countries";
import { DOCUMENT_MAX_BYTES, documentSides } from "@/lib/document-rules";
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

const UploadSlot = ({ side, preview, uploaded, uploading, disabled, onFile }) => (
  <label
    className={cn(
      "relative flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed bg-field p-4 text-center transition-colors",
      uploaded ? "border-up/40" : "border-white/15 hover:border-brand/50",
      disabled && "pointer-events-none opacity-60",
    )}
  >
    <input type="file" accept="image/jpeg,image/png" className="sr-only" disabled={disabled} onChange={onFile} />
    {preview && <Image src={preview} alt="" fill unoptimized className="object-cover opacity-40" />}
    <span className="relative flex flex-col items-center gap-2">
      {uploading ? <LoaderCircle className="size-6 animate-spin text-brand" /> : uploaded ? <CircleCheck className="size-6 text-up" /> : <ImagePlus className="size-6 text-neutral-500" strokeWidth={1.5} />}
      <span className="text-sm text-white">{side.label}</span>
      <span className="text-xs text-neutral-400">{uploading ? "Uploading…" : uploaded ? "Uploaded · tap to replace" : "JPG or PNG, up to 4 MB"}</span>
    </span>
  </label>
);

export const DocumentUploadForm = ({ uploaded }) => {
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
    if (!["image/jpeg", "image/png"].includes(file.type)) return toast.error("Upload a JPG or PNG image.");
    if (file.size > DOCUMENT_MAX_BYTES) return toast.error("Images must be 4 MB or smaller.");
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
          if (current[side.value]) URL.revokeObjectURL(current[side.value]);
          return { ...current, [side.value]: URL.createObjectURL(file) };
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
            uploading={uploading === side.value}
            disabled={Boolean(uploading) || submit.pending}
            onFile={handleFile(side)}
          />
        ))}
      </div>
      <p className="text-xs leading-5 text-neutral-500">Photos are stored privately and only visible to the review team. Make sure all four corners and your details are readable.</p>
      <GradientButton onClick={() => submit.submit()} disabled={!ready || Boolean(uploading) || submit.pending} className="self-start">
        {submit.pending ? "Submitting…" : "Submit Documents"}
      </GradientButton>
    </div>
  );
};
