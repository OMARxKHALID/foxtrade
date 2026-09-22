"use client";

import { useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Field, SummaryList, controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { usePlatform } from "@/hooks/use-platform";
import { applyFieldErrors } from "@/lib/action-result";
import { formatPrice, formatUsdt } from "@/lib/format";
import { formatDuration } from "@/lib/market/trading-rules";
import { pairLabel } from "@/lib/market/pairs";
import { notifyResult } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { placeTimedOrder } from "@/features/trading/actions/place-order";
import { ordersQuery, tradingKeys } from "@/features/trading/queries/trading-queries";
import { timedOrderSchemaFor } from "@/features/trading/schemas/order-schema";
import { directionLabels } from "@/features/trading/components/trade-format";

const presets = [10, 50, 100, 500];

export const TimedOrderSheet = ({ symbol, direction, open, onOpenChange, onPlaced }) => {
  const { timedDurations } = usePlatform().settings;
  const [ticker] = useLiveTickers([symbol]);
  const { data: orders } = useQuery(ordersQuery("timed"));
  const [pending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const up = direction === "call";
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(timedOrderSchemaFor(timedDurations)),
    defaultValues: { symbol, direction, duration: timedDurations[0].seconds, amount: 50 },
  });
  const duration = useWatch({ control, name: "duration" });
  const amount = useWatch({ control, name: "amount" });
  const rule = timedDurations.find((item) => item.seconds === Number(duration)) ?? timedDurations[0];
  const payout = (Number(amount) || 0) * (1 + rule.payoutRate);
  const firstDuration = timedDurations[0];

  useEffect(() => {
    if (open) reset({ symbol, direction, duration: firstDuration.seconds, amount: Math.max(50, firstDuration.minAmount) });
  }, [open, symbol, direction, firstDuration.seconds, firstDuration.minAmount, reset]);

  const handleDuration = (seconds) => setValue("duration", seconds, { shouldValidate: true });
  const handlePreset = (value) => setValue("amount", value, { shouldValidate: true });
  const handleConfirm = () =>
    handleSubmit((values) => {
      startTransition(async () => {
        const result = await placeTimedOrder(values);
        if (result.ok) {
          queryClient.invalidateQueries({ queryKey: tradingKeys.orders("timed") });
          onPlaced(result.data);
          return;
        }
        applyFieldErrors(result, setError);
        notifyResult(result);
      });
    })();

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={pairLabel(symbol)}
      description={ticker ? formatPrice(ticker.price) : "--"}
      aside={<span className={cn("font-heading text-base font-semibold", up ? "text-up" : "text-down")}>{directionLabels[direction]}</span>}
    >
      <form className="flex flex-col gap-5" noValidate onSubmit={(event) => event.preventDefault()}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs text-neutral-300">Choice cycle</legend>
          <div className="grid grid-cols-3 gap-2">
            {timedDurations.map((item) => (
              <button
                key={item.seconds}
                type="button"
                onClick={() => handleDuration(item.seconds)}
                aria-label={`${formatDuration(item.seconds)} · ${Math.round(item.payoutRate * 100)}% payout`}
                aria-pressed={item.seconds === rule.seconds}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg border py-3 text-xs transition-colors",
                  item.seconds === rule.seconds ? "border-brand/60 bg-brand/10 text-white" : "border-white/10 bg-field text-neutral-400",
                )}
              >
                <span className="font-medium">{formatDuration(item.seconds)}</span>
                <span className="text-2xs text-neutral-500">{Math.round(item.payoutRate * 100)}%</span>
              </button>
            ))}
          </div>
          {errors.duration && <p className="text-xs text-down">{errors.duration.message}</p>}
        </fieldset>

        <Field
          id="timed-sheet-amount"
          label="Purchase quantity"
          error={errors.amount?.message}
          hint={`Minimum ${rule.minAmount} USDT`}
          aside={
            <span className="text-xs text-neutral-500">
              Available <span className="text-white tabular-nums">{orders?.signedIn ? formatUsdt(orders.available) : "--"}</span>{" "}
              <Link href="/assets/transfer" className="text-brand">
                Transfer
              </Link>
            </span>
          }
        >
          <input
            id="timed-sheet-amount"
            type="number"
            inputMode="decimal"
            step="any"
            placeholder="Enter the purchase quantity"
            aria-invalid={Boolean(errors.amount)}
            className={controlClass}
            {...register("amount")}
          />
          <div className="grid grid-cols-4 gap-2">
            {presets.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handlePreset(value)}
                aria-pressed={Number(amount) === value}
                className={cn(
                  "h-11 rounded-lg border text-sm transition-colors active:bg-white/10 sm:h-9 sm:text-xs",
                  Number(amount) === value ? "border-brand/60 bg-brand/10 text-white" : "border-white/10 bg-field text-neutral-300",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </Field>

        <SummaryList
          items={[
            { label: "Payout rate", value: `${Math.round(rule.payoutRate * 100)}%` },
            { label: "Returned if correct", value: `${formatUsdt(payout)} USDT`, className: "text-up" },
            { label: "Lost if wrong", value: `${formatUsdt(Number(amount) || 0)} USDT`, className: "text-down" },
          ]}
        />

        <GradientButton variant={up ? "up" : "down"} size="lg" aria-busy={pending} disabled={pending} onClick={handleConfirm}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {pending ? "Placing…" : "Confirm the order"}
        </GradientButton>
        <p className="text-2xs leading-4 text-neutral-500">Orders settle at the Binance market price when the timer ends. Equal prices refund your stake.</p>
      </form>
    </BottomSheet>
  );
};
