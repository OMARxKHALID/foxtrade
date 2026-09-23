"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Eye, RotateCcw, ShieldCheck, Trophy, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { GradientButton, hitArea } from "@/components/ui/gradient-button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconButton } from "@/components/ui/icon-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatUsdt, shortDate as dateFormat } from "@/lib/format";
import { kycStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import { banClient, resetClientBalance, setClientForceWin, setClientsForceWin, unbanClient } from "@/features/admin/actions/admin-actions";


const tabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
  { value: "admins", label: "Admins" },
];

const columns = [
  { key: "select", header: <span className="sr-only">Select</span>, className: "w-10" },
  { key: "email", header: "Client", sortable: true },
  { key: "usdt", header: "USDT Balance", align: "right", sortable: true, hideBelow: "sm" },
  { key: "kyc", header: "KYC", hideBelow: "lg" },
  { key: "status", header: "Status", hideBelow: "sm" },
  { key: "createdAt", header: "Joined", sortable: true, hideBelow: "xl" },
  { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
];


export const ClientsTable = ({ clients }) => {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState(() => new Set());
  const [dialog, setDialog] = useState(null);
  const handleClose = () => setDialog(null);
  const ban = useActionSubmit({ action: banClient, successMessage: "Client banned.", onSuccess: handleClose });
  const unban = useActionSubmit({ action: unbanClient, successMessage: "Client unbanned." });
  const reset = useActionSubmit({ action: resetClientBalance, successMessage: "Balance reset.", onSuccess: handleClose });
  const forceWin = useActionSubmit({ action: setClientForceWin, successMessage: "Force win updated.", onSuccess: handleClose });
  const bulkForceWin = useActionSubmit({
    action: setClientsForceWin,
    onSuccess: ({ data }) => {
      toast.success(`Force win ${dialog?.enabled ? "enabled" : "disabled"} for ${data.count} client(s).`);
      setSelected(new Set());
      handleClose();
    },
  });

  const handleConfirm = (reason) => {
    if (dialog.type === "ban") ban.submit({ userId: dialog.client.id, reason });
    if (dialog.type === "reset") reset.submit(dialog.client.id);
    if (dialog.type === "forceWin") forceWin.submit({ userId: dialog.client.id, enabled: !dialog.client.forceWin });
    if (dialog.type === "bulkForceWin") bulkForceWin.submit({ userIds: dialog.userIds, enabled: dialog.enabled });
  };

  const dialogContent = dialog && {
    ban: {
      title: "Ban client",
      description: `${dialog.client?.email} will be signed out and blocked from signing in.`,
      reasonLabel: "Reason (shown to the client)",
      confirmLabel: "Ban Client",
      tone: "down",
    },
    reset: {
      title: "Reset practice balance",
      description: `Open trades of ${dialog.client?.email} will be cancelled, and all wallets cleared and refilled with the starting practice USDT.`,
      confirmLabel: "Reset Balance",
      tone: "orange",
    },
    bulkForceWin: {
      title: dialog.enabled ? "Enable force win" : "Disable force win",
      description: dialog.enabled
        ? `Every trade these ${dialog.userIds?.length} client(s) place while this is active will be settled as a win, regardless of the market.`
        : `These ${dialog.userIds?.length} client(s) go back to normal settlement, including trades already open. Trades that already settled keep their outcome.`,
      confirmLabel: dialog.enabled ? "Turn On" : "Turn Off",
      tone: "orange",
    },
    forceWin: {
      title: "Force win",
      description: dialog.client?.forceWin
        ? `${dialog.client?.email} goes back to normal settlement, including trades already open. Trades that already settled keep their outcome.`
        : `Every trade ${dialog.client?.email} places while this is active will be settled as a win, regardless of the market.`,
      confirmLabel: dialog.client?.forceWin ? "Turn Off" : "Turn On",
      tone: "orange",
    },
  }[dialog.type];

  const visible = clients.filter((client) => {
    if (tab === "all") return true;
    if (tab === "admins") return client.role === "admin";
    return tab === "banned" ? client.banned : !client.banned;
  });

  const selectable = visible.filter((client) => client.role !== "admin");
  const chosen = selectable.filter((client) => selected.has(client.id));
  const allChosen = selectable.length > 0 && chosen.length === selectable.length;

  const handleSelect = (id) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSelectAll = () => setSelected(allChosen ? new Set() : new Set(selectable.map((client) => client.id)));

  const handleTab = (value) => {
    setTab(value);
    setSelected(new Set());
  };

  const tableColumns = columns.map((column) =>
    column.key === "select"
      ? {
          ...column,
          header: selectable.length > 0 && (
            <Checkbox checked={allChosen} onChange={handleSelectAll} className={cn(hitArea, "after:-inset-3")} aria-label="Select all clients" />
          ),
        }
      : column,
  );

  const rows = visible.map((client) => ({
    id: client.id,
    searchText: client.email,
    sortValues: { email: client.email, usdt: Number(client.usdt), createdAt: client.createdAt },
    cells: {
      select:
        client.role === "admin" ? null : (
          <Checkbox
            checked={selected.has(client.id)}
            onChange={() => handleSelect(client.id)}
            className={cn(hitArea, "after:-inset-3")}
            aria-label={`Select ${client.email}`}
          />
        ),
      email: (
        <span className="block min-w-0">
          <Link href={`/admin/users/${client.id}`} className="block max-w-[9rem] truncate text-white hover:text-brand sm:max-w-[12rem] xl:max-w-xs">
            {client.email}
          </Link>
          {(client.role === "admin" || client.forceWin) && (
            <span className="mt-1 flex flex-wrap items-center gap-1">
              {client.role === "admin" && <StatusBadge tone="brand">Admin</StatusBadge>}
              {client.forceWin && <StatusBadge tone="warning">Force win</StatusBadge>}
            </span>
          )}
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
            <span className="hidden gap-2 sm:inline-flex">
              <IconButton
                label={client.forceWin ? `Disable force win for ${client.email}` : `Enable force win for ${client.email}`}
                aria-haspopup="dialog"
                onClick={() => setDialog({ type: "forceWin", client })}
              >
                <Trophy className={cn("size-4", client.forceWin && "text-warning")} />
              </IconButton>
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
            </span>
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
        tabs={<SegmentedTabs items={tabs} value={tab} onChange={handleTab} variant="pill" label="Client status" />}
        toolbar={
          chosen.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-xs whitespace-nowrap text-neutral-400">{chosen.length} selected</span>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <GradientButton
                  variant="dark"
                  size="xs"
                  onClick={() => setDialog({ type: "bulkForceWin", enabled: true, userIds: chosen.map((client) => client.id) })}
                >
                  <Trophy className="size-3.5" />
                  Enable Force Win
                </GradientButton>
                <GradientButton
                  variant="dark"
                  size="xs"
                  onClick={() => setDialog({ type: "bulkForceWin", enabled: false, userIds: chosen.map((client) => client.id) })}
                >
                  Disable Force Win
                </GradientButton>
              </div>
            </div>
          )
        }
        searchPlaceholder="Search by email"
        columns={tableColumns}
        rows={rows}
        initialSort={{ key: "createdAt", direction: "desc" }}
        emptyState={<EmptyState icon={Users} title="No clients found" text="Registered clients appear here." />}
      />
      <ConfirmDialog
        open={Boolean(dialog)}
        onOpenChange={(value) => !value && handleClose()}
        {...dialogContent}
        pending={ban.pending || reset.pending || forceWin.pending || bulkForceWin.pending}
        onConfirm={handleConfirm}
      />
    </>
  );
};
