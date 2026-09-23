"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, controlClass } from "@/components/ui/field";
import { GradientButton, focusRing, hitArea } from "@/components/ui/gradient-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatQuantity, shortDateTime as dateFormat } from "@/lib/format";
import { submitDeposit } from "@/features/assets/actions/assets-actions";
import { depositSchema } from "@/features/assets/schemas/assets-schema";
import { cn } from "@/lib/utils";

const statusTone = { pending: "warning", credited: "success", rejected: "danger" };
const statusLabel = { pending: "Awaiting review", credited: "Credited", rejected: "Rejected" };

const CopyButton = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Address copied" : "Copy address"}
      className={cn(hitArea, "flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white", focusRing)}
    >
      {copied ? <Check className="size-4 text-up" /> : <Copy className="size-4" />}
    </button>
  );
};

export const LiveDeposit = ({ addresses, minDeposit, deposits }) => {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(depositSchema),
    defaultValues: { network: addresses[0]?.network ?? "", amount: "", reference: "" },
  });

  const network = useWatch({ control, name: "network" });
  const selected = addresses.find((item) => item.network === network) ?? addresses[0];
  const { pending, submit } = useActionSubmit({
    action: submitDeposit,
    setError,
    successMessage: "Deposit reported. It is credited once we confirm the transfer.",
    onSuccess: () => reset({ network, amount: "", reference: "" }),
  });

  if (!addresses.length) {
    return (
      <GlowCard>
        <EmptyState
          icon={ShieldAlert}
          title="Deposits are closed right now"
          text="No deposit address has been published yet. Contact support before sending any funds."
          className="py-12"
        />
      </GlowCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
      <GlowCard as="section" aria-labelledby="deposit-title">
        <CardHeader id="deposit-title" title="Send USDT" description="Transfer from your own wallet or exchange, then report it below." />
        <CardBody className="flex flex-col gap-5">
          <Field id="deposit-network" label="Network" error={errors.network?.message}>
            <Controller
              name="network"
              control={control}
              render={({ field }) => (
                <SelectMenu
                  id="deposit-network"
                  options={addresses.map((item) => ({ value: item.network, label: item.network }))}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={Boolean(errors.network)}
                />
              )}
            />
          </Field>
          {selected && (
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-field p-3">
              <span className="text-xs text-neutral-500">{selected.network} deposit address</span>
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 break-all font-mono text-sm text-white">{selected.address}</span>
                <CopyButton value={selected.address} />
              </span>
              {selected.memo && <span className="text-xs text-warning">Memo / tag required: {selected.memo}</span>}
            </div>
          )}
          <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
            <Field id="deposit-amount" label="Amount sent" error={errors.amount?.message} hint={`Smallest deposit: ${formatQuantity(minDeposit)} USDT`}>
              <input id="deposit-amount" type="number" step="any" inputMode="decimal" aria-invalid={Boolean(errors.amount)} className={controlClass} {...register("amount")} />
            </Field>
            <Field id="deposit-reference" label="Transaction hash" error={errors.reference?.message} hint="Copy it from your wallet or the exchange withdrawal record.">
              <input id="deposit-reference" autoComplete="off" spellCheck={false} placeholder="Paste the transaction hash" aria-invalid={Boolean(errors.reference)} className={controlClass} {...register("reference")} />
            </Field>
            {errors.root?.message && <p className="text-xs text-down">{errors.root.message}</p>}
            <GradientButton type="submit" disabled={pending}>
              {pending ? "Reporting…" : "Report Transfer"}
            </GradientButton>
          </form>
        </CardBody>
      </GlowCard>

      <div className="flex flex-col gap-4 lg:gap-6">
        <GlowCard as="section" aria-labelledby="deposit-rules" className="h-fit">
          <CardHeader
            id="deposit-rules"
            title={
              <span className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-brand" />
                Before you send
              </span>
            }
          />
          <CardBody>
            <ol className="flex flex-col gap-4">
              {[
                "Send only USDT, and only on the network shown above. Anything else is lost.",
                "Reporting the transfer does not credit it. We check the transaction first.",
                "You are credited the amount that actually arrives, not the amount you type.",
              ].map((rule, i) => (
                <li key={rule} className="flex gap-3 text-sm leading-6 text-neutral-400">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-neutral-400">{i + 1}</span>
                  {rule}
                </li>
              ))}
            </ol>
          </CardBody>
        </GlowCard>

        {deposits.length > 0 && (
          <GlowCard as="section" aria-labelledby="deposit-history" className="h-fit overflow-hidden">
            <CardHeader id="deposit-history" title="Recent deposits" />
            <ul className="divide-y divide-white/5">
              {deposits.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
                  <span className="min-w-0">
                    <span className="block text-sm text-white tabular-nums">
                      {formatQuantity(item.amount)} {item.asset}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {item.network ? `${item.network} · ` : ""}
                      {dateFormat.format(new Date(item.createdAt))}
                    </span>
                  </span>
                  <StatusBadge tone={statusTone[item.status] ?? "neutral"}>{statusLabel[item.status] ?? item.status}</StatusBadge>
                </li>
              ))}
            </ul>
          </GlowCard>
        )}
      </div>
    </div>
  );
};
