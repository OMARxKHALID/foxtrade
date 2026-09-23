"use client";

import { useState } from "react";
import { ArrowDownToLine, BadgeCheck, Banknote, ShieldQuestion } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatQuantity, shortDateTime as dateFormat } from "@/lib/format";
import { approveAdjustment, approveClientWithdrawal, confirmClientDeposit, rejectAdjustment, rejectClientDeposit, rejectClientWithdrawal } from "@/features/admin/actions/admin-actions";


const Row = ({ children }) => <li className="flex flex-col gap-3 px-4 py-4 sm:px-6">{children}</li>;

export const ApprovalsPanels = ({ deposits, withdrawals, adjustments }) => {
  const [dialog, setDialog] = useState(null);
  const handleClose = () => setDialog(null);

  const approveWithdrawal = useActionSubmit({ action: approveClientWithdrawal, successMessage: "Withdrawal approved.", onSuccess: handleClose });
  const declineWithdrawal = useActionSubmit({ action: rejectClientWithdrawal, successMessage: "Withdrawal rejected and refunded.", onSuccess: handleClose });
  const approveChange = useActionSubmit({ action: approveAdjustment, successMessage: "Balance change approved.", onSuccess: handleClose });
  const declineChange = useActionSubmit({ action: rejectAdjustment, successMessage: "Balance change rejected.", onSuccess: handleClose });
  const confirmDeposit = useActionSubmit({ action: confirmClientDeposit, successMessage: "Deposit credited.", onSuccess: handleClose });
  const declineDeposit = useActionSubmit({ action: rejectClientDeposit, successMessage: "Deposit rejected.", onSuccess: handleClose });

  const pending = approveWithdrawal.pending || declineWithdrawal.pending || approveChange.pending || declineChange.pending || confirmDeposit.pending || declineDeposit.pending;

  const handleConfirm = (reason) => {
    if (dialog.type === "approveWithdrawal") approveWithdrawal.submit(dialog.id);
    if (dialog.type === "rejectWithdrawal") declineWithdrawal.submit({ id: dialog.id, reason });
    if (dialog.type === "approveAdjustment") approveChange.submit(dialog.id);
    if (dialog.type === "rejectAdjustment") declineChange.submit(dialog.id);
    if (dialog.type === "confirmDeposit") confirmDeposit.submit({ id: dialog.id, amount: reason });
    if (dialog.type === "rejectDeposit") declineDeposit.submit({ id: dialog.id, reason });
  };

  const dialogContent = dialog && {
    confirmDeposit: {
      title: "Credit deposit",
      description: `Credit ${dialog.label}. Check the amount against the transaction before confirming: this is what gets posted, not what the client typed.`,
      reasonLabel: "Amount that actually arrived (USDT)",
      reasonKind: "amount",
      reasonDefault: String(dialog.amount ?? ""),
      confirmLabel: "Credit Deposit",
      tone: "orange",
    },
    rejectDeposit: {
      title: "Reject deposit",
      description: `${dialog.label} will not be credited.`,
      reasonLabel: "Reason (recorded in the audit log)",
      confirmLabel: "Reject",
      tone: "down",
    },
    approveWithdrawal: {
      title: "Approve withdrawal",
      description: `${dialog.label} will be cleared for payout. The funds stay on hold until the payout is confirmed sent.`,
      confirmLabel: "Approve",
      tone: "orange",
    },
    rejectWithdrawal: {
      title: "Reject withdrawal",
      description: `${dialog.label} will be returned to the client's spot wallet.`,
      reasonLabel: "Reason (recorded in the audit log)",
      confirmLabel: "Reject and Refund",
      tone: "down",
    },
    approveAdjustment: {
      title: "Approve balance change",
      description: `${dialog.label} will be posted to the client's live wallet immediately.`,
      confirmLabel: "Approve",
      tone: "orange",
    },
    rejectAdjustment: {
      title: "Reject balance change",
      description: `${dialog.label} will not be posted.`,
      confirmLabel: "Reject",
      tone: "down",
    },
  }[dialog.type];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <GlowCard as="section" aria-labelledby="deposits-title" className="overflow-hidden">
          <CardHeader id="deposits-title" title={`Deposits (${deposits.length})`} description="Check the transaction on-chain, then credit the amount that actually arrived." />
          {deposits.length ? (
            <ul className="divide-y divide-white/5">
              {deposits.map((item) => (
                <Row key={item.id}>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{item.email}</span>
                      <span className="block text-xs text-neutral-500">{dateFormat.format(new Date(item.createdAt))}</span>
                    </span>
                    <StatusBadge tone="warning">
                      claims {formatQuantity(item.amount)} {item.asset}
                    </StatusBadge>
                  </span>
                  <span className="block truncate font-mono text-xs text-neutral-400">
                    {item.network ? `${item.network} · ` : ""}
                    {item.reference}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <GradientButton
                      size="xs"
                      onClick={() => setDialog({ type: "confirmDeposit", id: item.id, amount: item.amount, label: `${formatQuantity(item.amount)} ${item.asset} for ${item.email}` })}
                    >
                      <BadgeCheck className="size-3.5" />
                      Credit
                    </GradientButton>
                    <GradientButton
                      variant="dark"
                      size="xs"
                      onClick={() => setDialog({ type: "rejectDeposit", id: item.id, label: `${formatQuantity(item.amount)} ${item.asset} claimed by ${item.email}` })}
                    >
                      Reject
                    </GradientButton>
                  </span>
                </Row>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ArrowDownToLine} title="No deposits waiting" text="Transfers reported by live accounts appear here." className="py-10" />
          )}
        </GlowCard>

        <GlowCard as="section" aria-labelledby="withdrawals-title" className="overflow-hidden">
          <CardHeader id="withdrawals-title" title={`Withdrawals (${withdrawals.length})`} description="Funds are already held. Approving clears the payout; rejecting returns them." />
          {withdrawals.length ? (
            <ul className="divide-y divide-white/5">
              {withdrawals.map((item) => (
                <Row key={item.id}>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{item.email}</span>
                      <span className="block text-xs text-neutral-500">{dateFormat.format(new Date(item.createdAt))}</span>
                    </span>
                    <StatusBadge tone="warning">
                      {formatQuantity(item.amount)} {item.asset}
                    </StatusBadge>
                  </span>
                  <span className="block truncate font-mono text-xs text-neutral-400">
                    {item.network ? `${item.network} · ` : ""}
                    {item.address}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <GradientButton
                      size="xs"
                      onClick={() => setDialog({ type: "approveWithdrawal", id: item.id, label: `${formatQuantity(item.amount)} ${item.asset} for ${item.email}` })}
                    >
                      <BadgeCheck className="size-3.5" />
                      Approve
                    </GradientButton>
                    <GradientButton
                      variant="dark"
                      size="xs"
                      onClick={() => setDialog({ type: "rejectWithdrawal", id: item.id, label: `${formatQuantity(item.amount)} ${item.asset}` })}
                    >
                      Reject
                    </GradientButton>
                  </span>
                </Row>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Banknote} title="No withdrawals waiting" text="Requests from live accounts appear here." className="py-10" />
          )}
        </GlowCard>

        <GlowCard as="section" aria-labelledby="adjustments-title" className="overflow-hidden">
          <CardHeader id="adjustments-title" title={`Live balance changes (${adjustments.length})`} description="A live credit or debit needs a second admin. You cannot approve your own." />
          {adjustments.length ? (
            <ul className="divide-y divide-white/5">
              {adjustments.map((item) => (
                <Row key={item.id}>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{item.email}</span>
                      <span className="block text-xs text-neutral-500">
                        requested by {item.requestedBy} · {dateFormat.format(new Date(item.createdAt))}
                      </span>
                    </span>
                    <StatusBadge tone={item.amount.startsWith("-") ? "danger" : "success"}>
                      {item.amount} {item.asset}
                    </StatusBadge>
                  </span>
                  <span className="block text-xs text-neutral-400">
                    {item.wallet} wallet · {item.note}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <GradientButton
                      size="xs"
                      onClick={() => setDialog({ type: "approveAdjustment", id: item.id, label: `${item.amount} ${item.asset} for ${item.email}` })}
                    >
                      <BadgeCheck className="size-3.5" />
                      Approve
                    </GradientButton>
                    <GradientButton variant="dark" size="xs" onClick={() => setDialog({ type: "rejectAdjustment", id: item.id, label: `${item.amount} ${item.asset}` })}>
                      Reject
                    </GradientButton>
                  </span>
                </Row>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ShieldQuestion} title="Nothing to approve" text="Live balance changes raised by another admin appear here." className="py-10" />
          )}
        </GlowCard>
      </div>

      <ConfirmDialog key={dialog?.id} open={Boolean(dialog)} onOpenChange={(value) => !value && handleClose()} {...dialogContent} pending={pending} onConfirm={handleConfirm} />
    </>
  );
};
