"use client";

import { ImagePlus } from "lucide-react";
import { SchemaForm } from "@/components/forms/schema-form";
import { countries } from "@/lib/content/locales";
import { submitBasicVerification } from "@/features/account/actions/account-actions";
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

const UploadSlot = ({ label }) => (
  <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-field p-4 text-center">
    <ImagePlus className="size-6 text-neutral-500" strokeWidth={1.5} />
    <p className="text-sm text-white">{label}</p>
    <p className="text-xs text-neutral-500">JPG or PNG, up to 5 MB</p>
  </div>
);

export const DocumentUploads = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <UploadSlot label="Front of ID" />
    <UploadSlot label="Back of ID" />
  </div>
);
