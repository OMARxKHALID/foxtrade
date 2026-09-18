"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SummaryList } from "@/components/ui/field";
import { useMarkPrices } from "@/hooks/use-mark-prices";
import { useNow } from "@/hooks/use-now";
import { formatPrice, formatUsdt } from "@/lib/format";
import { formatDuration } from "@/lib/market/trading-rules";
import { pairLabel } from "@/lib/market/pairs";
import { cn } from "@/lib/utils";
import { ordersQuery } from "@/features/trading/queries/trading-queries";
import { SignedAmount, directionLabels, timedStatus } from "@/features/trading/components/trade-format";
import { expectedReturn, remainingFraction, secondsLeft, settledProfit } from "@/features/trading/components/timed-outcome";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const Ring = ({ fraction, label, tone }) => (
  <div className="relative mx-auto flex size-32 items-center justify-center">
    <svg viewBox="0 0 120 120" className="absolute size-full -rotate-90">
      <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="6" className="stroke-white/10" />
      <circle
        cx="60"
        cy="60"
        r={RADIUS}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
        className={cn("transition-[stroke-dashoffset] duration-1000 ease-linear", tone)}
      />
    </svg>
    <span className="font-heading text-2xl font-semibold text-white tabular-nums">{label}</span>
  </div>
);

const captions = {
  won: "Complete maturity settlement",
  lost: "Complete maturity settlement",
  draw: "Settled at the open price · stake refunded",
  cancelled: "Cancelled before settlement",
};

const ResultCard = ({ order }) => {
  const profit = settledProfit(order);
  const tone = order.status === "won" ? "bg-up text-black" : order.status === "lost" ? "bg-down text-white" : "bg-cell text-white";
  return (
    <div className={cn("flex flex-col items-center gap-1 rounded-xl px-4 py-7", tone)}>
      <span className="font-heading text-2xl font-semibold tabular-nums">
        {profit === null ? timedStatus[order.status]?.label ?? order.status : `${profit > 0 ? "+" : ""}${formatUsdt(profit)} USDT`}
      </span>
      <span className="text-xs opacity-80">{captions[order.status] ?? "Settled"}</span>
    </div>
  );
};

export const TimedOrderOverlay = ({ orderId, onClose }) => {
  const { data } = useQuery({ ...ordersQuery("timed"), enabled: Boolean(orderId) });
  const order = data?.items?.find((item) => item.id === orderId) ?? null;
  const open = order?.status === "open";
  const marks = useMarkPrices(order ? [order.symbol] : []);
  const now = useNow(open);
  const mark = order ? marks[order.symbol] : null;

  const handleOpenChange = (value) => {
    if (!value) onClose();
  };

  if (!order) {
    return (
      <BottomSheet open={Boolean(orderId)} onOpenChange={handleOpenChange} title="Placing order" description="Waiting for the exchange">
        <div className="flex h-32 items-center justify-center">
          <LoaderCircle className="size-6 animate-spin text-brand" />
        </div>
      </BottomSheet>
    );
  }

  const left = secondsLeft(order.expiresAt, now);
  const expected = expectedReturn(order, mark);
  const currentPrice = open ? mark : order.closePrice;

  return (
    <BottomSheet
      open={Boolean(orderId)}
      onOpenChange={handleOpenChange}
      title={pairLabel(order.symbol)}
      description={open ? `Settles in ${left}s` : "Settled"}
      aside={
        <span className={cn("font-heading text-base font-semibold", order.direction === "call" ? "text-up" : "text-down")}>
          {directionLabels[order.direction]}
        </span>
      }
    >
      <div className="flex flex-col gap-5">
        {open ? (
          <Ring
            fraction={remainingFraction(order.openedAt, order.expiresAt, now)}
            label={left ? left : <LoaderCircle className="size-6 animate-spin text-brand" />}
            tone="stroke-brand"
          />
        ) : (
          <ResultCard order={order} />
        )}

        <SummaryList
          items={[
            { label: open ? "Current price" : "Settlement price", value: currentPrice ? formatPrice(currentPrice) : "--" },
            { label: "Entry price", value: formatPrice(order.openPrice) },
            { label: "Period", value: formatDuration(order.duration) },
            { label: "Quantity", value: `${formatUsdt(order.amount)} USDT` },
            ...(open
              ? [{ label: "Expected return", value: <SignedAmount value={expected} />, className: "" }]
              : [{ label: "Payout", value: `${formatUsdt(order.payout ?? 0)} USDT` }]),
          ]}
        />

        <Link href={`/trade/timed/orders/${order.id}`} className="text-center text-xs text-brand">
          View order details
        </Link>
      </div>
    </BottomSheet>
  );
};
