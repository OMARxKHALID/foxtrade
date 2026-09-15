"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Eye, RotateCcw, ShieldCheck, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconButton } from "@/components/ui/icon-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatUsdt } from "@/lib/format";
import { kycStatus } from "@/lib/status";
import { banClient, resetClientBalance, unbanClient } from "@/features/admin/actions/admin-actions";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

const tabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
  { value: "admins", label: "Admins" },
];

const columns = [
  { key: "email", header: "Client", sortable: true },
  { key: "usdt", header: "USDT Balance", align: "right", sortable: true, hideBelow: "sm" },
  { key: "kyc", header: "KYC", hideBelow: "md" },
  { key: "status", header: "Status", hideBelow: "sm" },
  { key: "createdAt", header: "Joined", sortable: true, hideBelow: "lg" },
  { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
];


export const ClientsTable = ({ clients }) => {
  const router = useRouter();
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

  const visible = clients.filter((client) => {
    if (tab === "all") return true;
    if (tab === "admins") return client.role === "admin";
    return tab === "banned" ? client.banned : !client.banned;
  });

  const rows = visible.map((client) => ({
    id: client.id,
    searchText: client.email,
    sortValues: { email: client.email, usdt: client.usdt, createdAt: client.createdAt },
    cells: {
      email: (
        <span className="block min-w-0">
          <Link href={`/admin/users/${client.id}`} className="block max-w-[14rem] truncate text-white hover:text-brand sm:max-w-xs">
            {client.email}
          </Link>
          {client.role === "admin" && <StatusBadge tone="brand" className="mt-1">Admin</StatusBadge>}
          {client.banReason && <span className="block max-w-xs truncate text-xs text-down">{client.banReason}</span>}
        </span>
      ),
      usdt: <span className="text-white tabular-nums">{formatUsdt(client.usdt)}</span>,
      kyc: <StatusBadge tone={kycStatus[client.kyc].tone}>{kycStatus[client.kyc].label}</StatusBadge>,
      status: <StatusBadge tone={client.banned ? "danger" : "success"}>{client.banned ? "Banned" : "Active"}</StatusBadge>,
      createdAt: <span className="text-neutral-400">{dateFormat.format(new Date(client.createdAt))}</span>,
      actions: (
        <span className="inline-flex gap-2">
          <IconButton label={`Open ${client.email}`} onClick={() => router.push(`/admin/users/${client.id}`)}>
            <Eye className="size-4" />
          </IconButton>
          {client.role !== "admin" && (
            <>
              <IconButton label={`Reset balance for ${client.email}`} onClick={() => setDialog({ type: "reset", client })}>
                <RotateCcw className="size-4" />
              </IconButton>
              {client.banned ? (
                <IconButton label={`Unban ${client.email}`} disabled={unban.pending} onClick={() => unban.submit(client.id)}>
                  <ShieldCheck className="size-4 text-up" />
                </IconButton>
              ) : (
                <IconButton label={`Ban ${client.email}`} onClick={() => setDialog({ type: "ban", client })}>
                  <Ban className="size-4 text-down" />
                </IconButton>
              )}
            </>
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
