"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, FileSearch, FileText, IdCard, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { controlClass } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { GradientButton } from "@/components/ui/gradient-button";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconButton } from "@/components/ui/icon-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { combinedSide, documentSides } from "@/lib/document-rules";
import { documentStatus, kycStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import { reviewClientDocuments, reviewClientVerification } from "@/features/admin/actions/admin-actions";
import { shortDateTime as dateFormat } from "@/lib/format";


const tabs = [
  { value: "pending", label: kycStatus.pending.label },
  { value: "approved", label: kycStatus.approved.label },
  { value: "rejected", label: kycStatus.rejected.label },
  { value: "documents", label: "Documents to review" },
];

const columns = [
  { key: "client", header: "Client", sortable: true },
  { key: "identity", header: "Identity", hideBelow: "md" },
  { key: "submittedAt", header: "Submitted", sortable: true, hideBelow: "sm" },
  { key: "status", header: "Status" },
  { key: "documents", header: "Documents", hideBelow: "lg" },
  { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
];

const DocumentsDialog = ({ submission, onClose }) => {
  const [reason, setReason] = useState("");
  const review = useActionSubmit({ action: reviewClientDocuments, successMessage: "Documents review saved.", onSuccess: onClose });
  const { status } = submission.documents;

  const handleReason = (event) => setReason(event.target.value);
  const handleApprove = () => review.submit({ id: submission.id, decision: "approved" });
  const handleReject = () => review.submit({ id: submission.id, decision: "rejected", reason: reason.trim() });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-300">
        {submission.fullName} · ID {submission.idNumber}
        <StatusBadge tone={documentStatus[status].tone}>{documentStatus[status].label}</StatusBadge>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(submission.documents.combined ? [{ ...combinedSide, value: "front" }] : documentSides).map((side) => {
          const href = `/api/admin/kyc/${submission.id}/${side.value}`;
          const pdf = submission.documents.formats[side.value] === "pdf";
          return (
            <figure key={side.value} className="flex flex-col gap-2">
              {pdf ? (
                <a href={href} className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-field text-sm text-white transition-colors hover:border-brand/50">
                  <FileText className="size-8 text-neutral-400" strokeWidth={1.5} />
                  PDF document
                </a>
              ) : (
                <a href={href} target="_blank" rel="noreferrer" className="relative block aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-field">
                  <Image src={href} alt={`${side.label} of ${submission.fullName}`} fill unoptimized className="object-contain" />
                </a>
              )}
              <figcaption className="text-xs text-neutral-500">{side.label} · {pdf ? "downloads the PDF" : "opens full size"}</figcaption>
            </figure>
          );
        })}
      </div>
      {status !== "rejected" && (
        <label className="flex flex-col gap-2 text-xs text-neutral-300">
          Rejection reason (shown to the client)
          <textarea rows={2} value={reason} onChange={handleReason} className={cn(controlClass, "h-auto py-3")} />
        </label>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        {status !== "rejected" && (
          <GradientButton variant="down" size="sm" disabled={review.pending || reason.trim().length < 3} onClick={handleReject}>
            Reject Documents
          </GradientButton>
        )}
        {status !== "approved" && (
          <GradientButton variant="up" size="sm" disabled={review.pending} onClick={handleApprove}>
            Approve Documents
          </GradientButton>
        )}
      </div>
    </div>
  );
};

export const KycTable = ({ submissions }) => {
  const [tab, setTab] = useState("pending");
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const handleClose = () => setRejecting(null);
  const review = useActionSubmit({ action: reviewClientVerification, successMessage: "Review saved.", onSuccess: handleClose });

  const handleReject = (reason) => review.submit({ id: rejecting.id, decision: "rejected", reason });

  const rows = submissions
    .filter((item) => (tab === "documents" ? item.documents.status === "pending" : item.status === tab))
    .map((item) => ({
      id: item.id,
      searchText: `${item.email} ${item.fullName} ${item.country}`,
      sortValues: { client: item.email, submittedAt: item.submittedAt },
      cells: {
        client: (
          <span className="block">
            <span className="block max-w-[14rem] truncate text-white sm:max-w-xs">{item.email}</span>
            <span className="block text-xs text-neutral-500">{item.fullName}</span>
          </span>
        ),
        identity: (
          <span className="block text-neutral-300">
            {item.country} · {item.city}
            <span className="block text-xs text-neutral-500">ID {item.idNumber}</span>
          </span>
        ),
        submittedAt: <span className="text-neutral-400">{dateFormat.format(new Date(item.submittedAt))}</span>,
        status: (
          <span className="block">
            <StatusBadge tone={kycStatus[item.status].tone}>{kycStatus[item.status].label}</StatusBadge>
            {item.reason && <span className="mt-1 block max-w-[12rem] truncate text-xs text-neutral-500">{item.reason}</span>}
          </span>
        ),
        documents: <StatusBadge tone={documentStatus[item.documents.status].tone}>{documentStatus[item.documents.status].label}</StatusBadge>,
        actions:
          <span className="inline-flex gap-2">
            {item.documents.hasFront && item.documents.hasBack && (
              <IconButton label={`Review documents of ${item.email}`} onClick={() => setViewing(item)}>
                <FileSearch className="size-4" />
              </IconButton>
            )}
            {item.status !== "approved" && (
              <IconButton label={`Approve ${item.email}`} disabled={review.pending} onClick={() => review.submit({ id: item.id, decision: "approved" })}>
                <Check className="size-4 text-up" />
              </IconButton>
            )}
            {item.status !== "rejected" && (
              <IconButton label={`Reject ${item.email}`} onClick={() => setRejecting(item)}>
                <X className="size-4 text-down" />
              </IconButton>
            )}
          </span>,
      },
    }));

  return (
    <>
      <DataTable
        tabs={<SegmentedTabs items={tabs} value={tab} onChange={setTab} variant="pill" label="Review status" />}
        searchPlaceholder="Search submissions"
        columns={columns}
        rows={rows}
        initialSort={{ key: "submittedAt", direction: "desc" }}
        emptyState={<EmptyState icon={IdCard} title={tab === "documents" ? "No documents waiting" : `No submissions ${kycStatus[tab].label.toLowerCase()}`} text="Identity submissions from clients appear here." />}
      />
      <FormDialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)} title={viewing ? `Documents · ${viewing.email}` : ""} description="Private images, loaded only for admins.">
        {viewing && <DocumentsDialog key={viewing.id} submission={viewing} onClose={() => setViewing(null)} />}
      </FormDialog>
      <ConfirmDialog
        open={Boolean(rejecting)}
        onOpenChange={(value) => !value && handleClose()}
        title="Reject verification"
        description={`${rejecting?.email} will see this reason and can submit again.`}
        reasonLabel="Reason"
        confirmLabel="Reject"
        tone="down"
        pending={review.pending}
        onConfirm={handleReject}
      />
    </>
  );
};
