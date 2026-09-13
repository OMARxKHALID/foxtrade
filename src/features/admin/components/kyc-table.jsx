"use client";

import { useState } from "react";
import { Check, IdCard, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { reviewClientVerification } from "@/features/admin/actions/admin-actions";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const tones = { pending: "brand", approved: "success", rejected: "danger" };

const tabs = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const columns = [
  { key: "client", header: "Client", sortable: true },
  { key: "identity", header: "Identity", hideBelow: "md" },
  { key: "submittedAt", header: "Submitted", sortable: true, hideBelow: "sm" },
  { key: "status", header: "Status" },
  { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
];

export const KycTable = ({ submissions }) => {
  const [tab, setTab] = useState("pending");
  const [rejecting, setRejecting] = useState(null);
  const handleClose = () => setRejecting(null);
  const review = useActionSubmit({ action: reviewClientVerification, successMessage: "Review saved.", onSuccess: handleClose });

  const handleReject = (reason) => review.submit({ id: rejecting.id, decision: "rejected", reason });

  const rows = submissions
    .filter((item) => item.status === tab)
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
            <StatusBadge tone={tones[item.status]}>{item.status}</StatusBadge>
            {item.reason && <span className="mt-1 block max-w-[12rem] truncate text-xs text-neutral-500">{item.reason}</span>}
          </span>
        ),
        actions:
          item.status === "pending" ? (
            <span className="inline-flex gap-2">
              <button type="button" aria-label={`Approve ${item.email}`} disabled={review.pending} onClick={() => review.submit({ id: item.id, decision: "approved" })} className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 disabled:opacity-50">
                <Check className="size-4 text-up" />
              </button>
              <button type="button" aria-label={`Reject ${item.email}`} onClick={() => setRejecting(item)} className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10">
                <X className="size-4 text-down" />
              </button>
            </span>
          ) : null,
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
        emptyState={<EmptyState icon={IdCard} title={`No ${tab} submissions`} text="Identity submissions from clients appear here." />}
      />
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
