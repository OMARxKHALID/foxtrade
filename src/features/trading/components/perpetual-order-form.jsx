"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, SummaryList, controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { Slider } from "@/components/ui/slider";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { formatPrice, formatUsdt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { placePerpetualOrder } from "@/features/trading/actions/place-order";
import { usePlatform } from "@/hooks/use-platform";
import { ordersQuery, tradingKeys } from "@/features/trading/queries/trading-queries";
import { perpetualOrderSchemaFor } from "@/features/trading/schemas/order-schema";

const sides = [
  { value: "long", label: "Long" },
  { value: "short", label: "Short" },
];

const types = [
  { value: "market", label: "Market" },
  { value: "limit", label: "Limit" },
];

const leverageMarks = [1, 10, 25, 50, 100];

export const PerpetualOrderForm = ({ symbol, enabled = true, maxLeverage }) => {
  const { takerFeeRate, maintenanceMarginRate } = usePlatform().settings;
  const [ticker] = useLiveTickers([symbol]);
  const [showTpSl, setShowTpSl] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(perpetualOrderSchemaFor(maxLeverage)),
    defaultValues: { symbol, side: "long", type: "market", amount: 100, leverage: Math.min(10, maxLeverage) },
  });
  const [side, type, amount, leverage, limitPrice] = useWatch({ control, name: ["side", "type", "amount", "leverage", "price"] });

  const entry = type === "limit" && Number(limitPrice) > 0 ? Number(limitPrice) : ticker?.price ?? 0;
  const margin = Number(amount) || 0;
  const lev = Number(leverage) || 1;
  const notional = margin * lev;
  const fee = notional * takerFeeRate;
  const liquidation =
    entry > 0
      ? side === "long"
        ? entry * (1 - 1 / lev + maintenanceMarginRate)
        : entry * (1 + 1 / lev - maintenanceMarginRate)
      : 0;

  const handleSide = (value) => setValue("side", value);
  const handleType = (value) => setValue("type", value, { shouldValidate: false });
  const handleLeverage = (value) => setValue("leverage", value);
  const queryClient = useQueryClient();
  const { data: orders } = useQuery(ordersQuery("perpetual"));
  const { pending, submit: handlePlace } = useActionSubmit({
    action: placePerpetualOrder,
    setError,
    successMessage: type === "limit" ? "Limit order placed." : "Position opened.",
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tradingKeys.orders("perpetual") }),
  });

  return (
    <form className="flex flex-col gap-5 p-4 sm:p-6" noValidate onSubmit={handleSubmit(handlePlace)}>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-field p-1">
        {sides.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={side === item.value}
            onClick={() => handleSide(item.value)}
            className={cn(
              "h-9 rounded-md text-sm font-medium",
              side === item.value && item.value === "long" && "bg-up text-black",
              side === item.value && item.value === "short" && "bg-down text-white",
              side !== item.value && "text-neutral-400",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <SegmentedTabs items={types} value={type} onChange={handleType} label="Order type" />

      {type === "limit" && (
        <Field id="perp-price" label="Limit price (USDT)" error={errors.price?.message}>
          <input id="perp-price" type="number" step="any" inputMode="decimal" placeholder={ticker ? String(ticker.price) : ""} aria-invalid={Boolean(errors.price)} className={controlClass} {...register("price")} />
        </Field>
      )}

      <Field
        id="perp-amount"
        label="Margin (USDT)"
        error={errors.amount?.message}
        aside={
          <span className="text-xs text-neutral-500">
            Available <span className="text-white tabular-nums">{orders?.signedIn ? formatUsdt(orders.available) : "--"}</span>{" "}
            <Link href="/assets/transfer" className="text-brand">
              Transfer
            </Link>
          </span>
        }
      >
        <input id="perp-amount" type="number" step="any" inputMode="decimal" aria-invalid={Boolean(errors.amount)} className={controlClass} {...register("amount")} />
      </Field>

      <Field label="Leverage" aside={<span className="text-sm font-semibold text-white">{lev}x</span>}>
        <Controller
          name="leverage"
          control={control}
          render={({ field }) => <Slider label="Leverage" min={1} max={maxLeverage} value={Number(field.value)} onChange={field.onChange} />}
        />
        <div className="flex justify-between">
          {leverageMarks.filter((mark) => mark <= maxLeverage).map((mark) => (
            <button key={mark} type="button" onClick={() => handleLeverage(mark)} className={cn("text-[11px]", lev === mark ? "text-brand" : "text-neutral-500")}>
              {mark}x
            </button>
          ))}
        </div>
      </Field>

      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <Checkbox checked={showTpSl} onChange={setShowTpSl} />
        Take profit / Stop loss
      </label>
      {showTpSl && (
        <div className="grid grid-cols-2 gap-3">
          <Field id="perp-tp" label="TP price" error={errors.takeProfit?.message}>
            <input id="perp-tp" type="number" step="any" className={controlClass} {...register("takeProfit", { shouldUnregister: true })} />
          </Field>
          <Field id="perp-sl" label="SL price" error={errors.stopLoss?.message}>
            <input id="perp-sl" type="number" step="any" className={controlClass} {...register("stopLoss", { shouldUnregister: true })} />
          </Field>
        </div>
      )}

      <SummaryList
        items={[
          { label: "Entry price", value: entry ? formatPrice(entry) : "--" },
          { label: "Position size", value: `${formatUsdt(notional)} USDT` },
          { label: "Est. liquidation", value: liquidation ? formatPrice(liquidation) : "--", className: "text-down" },
          { label: `Fee (${+(takerFeeRate * 100).toFixed(4)}%)`, value: `${formatUsdt(fee)} USDT` },
        ]}
      />

      {!enabled && <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">Futures trading on this pair is paused by the admin.</p>}
      <GradientButton type="submit" variant={side === "long" ? "up" : "down"} size="lg" disabled={pending || !enabled}>
        {side === "long" ? "Open Long" : "Open Short"}
      </GradientButton>
    </form>
  );
};
