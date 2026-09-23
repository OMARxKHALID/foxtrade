"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BugOff, ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton, hitArea } from "@/components/ui/gradient-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { cn } from "@/lib/utils";
import { clearErrorLog } from "@/features/admin/actions/error-actions";
import { shortDateTime as dateFormat } from "@/lib/format";


const columns = [
  { key: "error", header: "Error", sortable: true },
  { key: "count", header: "Seen", align: "right", sortable: true },
  { key: "where", header: "Where", hideBelow: "md" },
  { key: "lastSeenAt", header: "Last seen", sortable: true, hideBelow: "sm" },
];

const contextLabel = (context) => {
  const parts = [context.route, context.job, context.action].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
};

export const ErrorsTable = ({ errors }) => {
  const router = useRouter();
  const [open, setOpen] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const clear = useActionSubmit({
    action: clearErrorLog,
    successMessage: "Error log cleared.",
    onSuccess: () => {
      setConfirming(false);
      router.refresh();
    },
  });

  const rows = errors.map((item) => ({
    id: item.id,
    searchText: `${item.name} ${item.message} ${contextLabel(item.context)}`,
    sortValues: { error: item.message, count: item.count, lastSeenAt: item.lastSeenAt },
    cells: {
      error: (
        <span className="block min-w-0">
          <button
            type="button"
            onClick={() => setOpen(open === item.id ? null : item.id)}
            className={cn(hitArea, "flex max-w-full items-start gap-1.5 text-left")}
            aria-expanded={open === item.id}
          >
            <ChevronDown className={cn("mt-0.5 size-3.5 shrink-0 text-neutral-500 transition-transform", open === item.id && "rotate-180")} />
            <span className="min-w-0">
              <span className="block truncate text-white">{item.message}</span>
              <span className="block text-xs text-neutral-500">{item.name}</span>
            </span>
          </button>
          {open === item.id && (
            <span className="mt-2 block max-h-56 overflow-auto rounded-lg bg-black/40 p-3">
              <span className="block font-mono text-2xs leading-5 whitespace-pre-wrap text-neutral-400">{item.stack || "No stack recorded."}</span>
              {Object.keys(item.context).length > 0 && (
                <span className="mt-2 block font-mono text-2xs text-neutral-500">{JSON.stringify(item.context)}</span>
              )}
              <span className="mt-2 block text-2xs text-neutral-600">First seen {item.firstSeenAt ? dateFormat.format(new Date(item.firstSeenAt)) : "—"}</span>
            </span>
          )}
        </span>
      ),
      count: (
        <StatusBadge tone={item.count >= 10 ? "danger" : item.count >= 3 ? "warning" : "neutral"}>
          {item.count}×
        </StatusBadge>
      ),
      where: <span className="text-neutral-400">{contextLabel(item.context)}</span>,
      lastSeenAt: <span className="text-neutral-400">{item.lastSeenAt ? dateFormat.format(new Date(item.lastSeenAt)) : "—"}</span>,
    },
  }));

  return (
    <>
      <DataTable
        title={`Errors (${errors.length})`}
        titleId="errors-title"
        description="Grouped by cause, newest first. Kept for 30 days."
        searchPlaceholder="Search errors"
        columns={columns}
        rows={rows}
        initialSort={{ key: "lastSeenAt", direction: "desc" }}
        filters={
          errors.length > 0 && (
            <GradientButton variant="dark" size="xs" onClick={() => setConfirming(true)}>
              Clear Log
            </GradientButton>
          )
        }
        emptyState={<EmptyState icon={BugOff} title="Nothing has failed" text="Server errors your clients hit will be collected here." />}
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={(value) => !value && setConfirming(false)}
        title="Clear error log"
        description="Every recorded error is deleted. This does not fix anything, it only clears the list."
        confirmLabel="Clear Log"
        tone="down"
        pending={clear.pending}
        onConfirm={() => clear.submit()}
      />
    </>
  );
};
