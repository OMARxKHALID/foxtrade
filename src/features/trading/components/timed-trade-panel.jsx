"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import { Field, SummaryList, controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { applyFieldErrors } from "@/lib/action-result";
import { notifyResult } from "@/lib/notify";
import { formatPrice, formatUsdt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { placeTimedOrder } from "@/features/trading/actions/place-order";
import { usePlatform } from "@/hooks/use-platform";
import { formatDuration } from "@/lib/market/trading-rules";
import { ordersQuery, tradingKeys } from "@/features/trading/queries/trading-queries";
import { timedOrderSchemaFor } from "@/features/trading/schemas/order-schema";

const presets = [10, 50, 100, 500];

export const TimedTradePanel = ({ symbol, enabled = true }) => {
  const { timedDurations } = usePlatform().settings;
  const [ticker] = useLiveTickers([symbol]);
  const [pending, startTransition] = useTransition();
  const [activeDirection, setActiveDirection] = useState(null);
  const locked = useRef(false);
  const queryClient = useQueryClient();
  const { data: orders } = useQuery(ordersQuery("timed"));
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(timedOrderSchemaFor(timedDurations)),
    defaultValues: { symbol, direction: "call", duration: timedDurations[0].seconds, amount: 50 },
  });
  const duration = useWatch({ control, name: "duration" });
  const amount = useWatch({ control, name: "amount" });
  const rule = timedDurations.find((item) => item.seconds === Number(duration)) ?? timedDurations[0];
  const payout = (Number(amount) || 0) * (1 + rule.payoutRate);

  const handleDuration = (seconds) => setValue("duration", seconds, { shouldValidate: true });
  const handlePreset = (value) => setValue("amount", value, { shouldValidate: true });
  const handlePlace = (direction) =>
    handleSubmit((values) => {
      if (locked.current || !enabled) return;
      locked.current = true;
      setActiveDirection(direction);
      startTransition(async () => {
        try {
          const result = await placeTimedOrder({ ...values, direction });
          if (result.ok) {
            notifyResult(result, `${direction === "call" ? "Call" : "Put"} placed · settles in ${values.duration}s`);
            queryClient.invalidateQueries({ queryKey: tradingKeys.orders("timed") });
            return;
          }
          applyFieldErrors(result, setError);
          notifyResult(result);
        } finally {
          locked.current = false;
          setActiveDirection(null);
        }
      });
    })();

  const directions = [
    { value: "call", label: "Call", variant: "up", icon: ArrowUpRight },
    { value: "put", label: "Put", variant: "down", icon: ArrowDownRight },
  ];

  return (
    <form className="flex flex-col gap-5 p-4 sm:p-6" noValidate onSubmit={(event) => event.preventDefault()}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-white">Timed trade</h2>
        <span className="text-xs text-neutral-500">
          Price <span className="text-white tabular-nums">{ticker ? formatPrice(ticker.price) : "--"}</span>
        </span>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs text-neutral-300">Duration</legend>
        <div className="grid grid-cols-5 gap-2">
          {timedDurations.map((item) => (
            <button
              key={item.seconds}
              type="button"
              onClick={() => handleDuration(item.seconds)}
              aria-pressed={item.seconds === rule.seconds}
              className={cn(
                "flex flex-col items-center rounded-lg border py-2 text-xs",
                item.seconds === rule.seconds ? "border-brand/60 bg-brand/10 text-white" : "border-white/10 bg-field text-neutral-400",
              )}
            >
              <span className="font-medium">{formatDuration(item.seconds)}</span>
              <span className="text-[11px] text-neutral-500">{Math.round(item.payoutRate * 100)}%</span>
            </button>
          ))}
        </div>
        {errors.duration && <p className="text-xs text-down">{errors.duration.message}</p>}
      </fieldset>

      <Field id="timed-amount" label="Amount (USDT)" error={errors.amount?.message} hint={`Minimum ${rule.minAmount} USDT`}
        aside={
          <span className="text-xs text-neutral-500">
            Available <span className="text-white tabular-nums">{orders?.signedIn ? formatUsdt(orders.available) : "--"}</span>{" "}
            <Link href="/assets/transfer" className="text-brand">
              Transfer
            </Link>
          </span>
        }
      >
        <input id="timed-amount" type="number" inputMode="decimal" step="any" aria-invalid={Boolean(errors.amount)} className={controlClass} {...register("amount")} />
        <div className="grid grid-cols-4 gap-2">
          {presets.map((value) => (
            <button key={value} type="button" onClick={() => handlePreset(value)} className="h-8 rounded-lg border border-white/10 bg-field text-xs text-neutral-300">
              {value}
            </button>
          ))}
        </div>
      </Field>

      <SummaryList
        items={[
          { label: "Payout rate", value: `${Math.round(rule.payoutRate * 100)}%` },
          { label: "Payout if correct", value: `${formatUsdt(payout)} USDT`, className: "text-up" },
        ]}
      />

      {!enabled && <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">Options trading on this pair is paused by the admin.</p>}
      <div className="grid grid-cols-2 gap-3">
        {directions.map((item) => {
          const active = activeDirection === item.value;
          const Icon = active ? LoaderCircle : item.icon;
          return (
            <GradientButton
              key={item.value}
              variant={item.variant}
              size="lg"
              aria-busy={active}
              aria-disabled={pending || !enabled}
              disabled={!enabled}
              onClick={() => handlePlace(item.value)}
              className={cn("active:scale-[0.98]", pending && "cursor-default", pending && !active && "pointer-events-none")}
            >
              <Icon className={cn("size-4", active && "animate-spin")} />
              {active ? "Placing…" : item.label}
            </GradientButton>
          );
        })}
      </div>
      <p className="text-[11px] leading-4 text-neutral-500">
        Orders settle at the Binance market price when the timer ends. Equal prices refund your stake.
      </p>
    </form>
  );
};
