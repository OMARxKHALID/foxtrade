"use client";

import { useState } from "react";
import { Ban, RotateCcw, ShieldCheck, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatPrice } from "@/lib/format";
import { banClient, resetClientBalance, unbanClient } from "@/features/admin/actions/admin-actions";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

const kycBadges = {
  none: { tone: "neutral", label: "None" },
  pending: { tone: "brand", label: "Pending" },
  approved: { tone: "success", label: "Verified" },
  rejected: { tone: "danger", label: "Rejected" },
};

const tabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
];

const columns = [
  { key: "email", header: "Client", sortable: true },
  { key: "usdt", header: "USDT Balance", align: "right", sortable: true, hideBelow: "sm" },
  { key: "kyc", header: "KYC", hideBelow: "md" },
  { key: "status", header: "Status", hideBelow: "sm" },
  { key: "createdAt", header: "Joined", sortable: true, hideBelow: "lg" },
  { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
];

const iconButton = "inline-flex size-8 items-center justify-center rounded-lg border border-white/10 text-neutral-300 disabled:opacity-50";

export const ClientsTable = ({ clients }) => {
  const [tab, setTab] = useState("all");
  const [dialog, setDialog] = useState(null);
  const handleClose = () => setDialog(null);
  const ban = useActionSubmit({ action: banClient, successMessage: "Client banned.", onSuccess: handleClose });
  const unban = useActionSubmit({ action: unbanClient, successMessage: "Client unbanned." });
  const reset = useActionSubmit({ action: resetClientBalance, successMessage: "Balance reset.", onSuccess: handleClose });

  const handleConfirm = (reason) => {
    if (dialog.type === "ban") ban.submit({ userId: dialog.client.id, reason });
    if (dialog.type === "reset") reset.submit(dialog.client.id);
  };

  const visible = clients.filter((client) => tab === "all" || (tab === "banned" ? client.banned : !client.banned));

  const rows = visible.map((client) => ({
    id: client.id,
    searchText: client.email,
    sortValues: { email: client.email, usdt: client.usdt, createdAt: client.createdAt },
    cells: {
      email: (
        <span className="block min-w-0">
          <span className="block max-w-[14rem] truncate text-white sm:max-w-xs">{client.email}</span>
          {client.banReason && <span className="block max-w-xs truncate text-xs text-down">{client.banReason}</span>}
        </span>
      ),
      usdt: <span className="text-white tabular-nums">{formatPrice(client.usdt)}</span>,
      kyc: <StatusBadge tone={kycBadges[client.kyc].tone}>{kycBadges[client.kyc].label}</StatusBadge>,
      status: <StatusBadge tone={client.banned ? "danger" : "success"}>{client.banned ? "Banned" : "Active"}</StatusBadge>,
      createdAt: <span className="text-neutral-400">{dateFormat.format(new Date(client.createdAt))}</span>,
      actions: (
        <span className="inline-flex gap-2">
          <button type="button" aria-label={`Reset balance for ${client.email}`} title="Reset demo balance" className={iconButton} onClick={() => setDialog({ type: "reset", client })}>
            <RotateCcw className="size-4" />
          </button>
          {client.banned ? (
            <button type="button" aria-label={`Unban ${client.email}`} title="Unban" disabled={unban.pending} className={iconButton} onClick={() => unban.submit(client.id)}>
              <ShieldCheck className="size-4 text-up" />
            </button>
          ) : (
            <button type="button" aria-label={`Ban ${client.email}`} title="Ban" className={iconButton} onClick={() => setDialog({ type: "ban", client })}>
              <Ban className="size-4 text-down" />
            </button>
          )}
        </span>
      ),
    },
  }));

  return (
    <>
      <DataTable
        title={`Clients (${clients.length})`}
        titleId="clients-title"
        tabs={<SegmentedTabs items={tabs} value={tab} onChange={setTab} variant="pill" label="Client status" />}
        searchPlaceholder="Search by email"
        columns={columns}
        rows={rows}
        initialSort={{ key: "createdAt", direction: "desc" }}
        emptyState={<EmptyState icon={Users} title="No clients found" text="Registered clients appear here." />}
      />
      <ConfirmDialog
        open={Boolean(dialog)}
        onOpenChange={(value) => !value && handleClose()}
        title={dialog?.type === "ban" ? "Ban client" : "Reset demo balance"}
        description={
          dialog?.type === "ban"
            ? `${dialog?.client.email} will be signed out and blocked from signing in.`
            : `Open trades of ${dialog?.client.email} will be cancelled, and all wallets cleared and refilled with the starting demo USDT.`
        }
        reasonLabel={dialog?.type === "ban" ? "Reason (shown to the client)" : undefined}
        confirmLabel={dialog?.type === "ban" ? "Ban Client" : "Reset Balance"}
        tone={dialog?.type === "ban" ? "down" : "orange"}
        pending={ban.pending || reset.pending}
        onConfirm={handleConfirm}
      />
    </>
  );
};
