"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { SummaryList } from "@/components/ui/field";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { usePlatform } from "@/hooks/use-platform";
import { formatPrice, formatUsdt } from "@/lib/format";
import { formatDuration } from "@/lib/market/trading-rules";
import { ordersQuery } from "@/features/trading/queries/trading-queries";
import { TimedOrderSheet } from "@/features/trading/components/timed-order-sheet";
import { TimedOrderOverlay } from "@/features/trading/components/timed-order-overlay";
import { directionLabels } from "@/features/trading/components/trade-format";

const directions = [
  { value: "call", variant: "up", icon: ArrowUpRight },
  { value: "put", variant: "down", icon: ArrowDownRight },
];

export const TimedTradePanel = ({ symbol, enabled = true }) => {
  const { timedDurations } = usePlatform().settings;
  const [ticker] = useLiveTickers([symbol]);
  const { data: orders } = useQuery(ordersQuery("timed"));
  const [direction, setDirection] = useState("call");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [placedId, setPlacedId] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const openCount = orders?.items?.filter((item) => item.status === "open").length ?? 0;

  const handleOpen = (value) => {
    setDirection(value);
    setSheetOpen(true);
  };
  const handlePlaced = (orderId) => {
    setSheetOpen(false);
    setPlacedId(orderId);
    setOverlayOpen(true);
  };
  const handleOverlayClose = () => setOverlayOpen(false);

  return (
    <div className="flex h-full flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-white">Timed trade</h2>
        <span className="text-xs text-neutral-500">
          Price <span className="text-white tabular-nums">{ticker ? formatPrice(ticker.price) : "--"}</span>
        </span>
      </div>

      <table className="w-full text-xs">
        <caption className="sr-only">Payout by cycle</caption>
        <thead>
          <tr className="text-left text-2xs text-neutral-500">
            <th scope="col" className="pb-2 font-normal">Cycle</th>
            <th scope="col" className="pb-2 text-right font-normal">Payout</th>
            <th scope="col" className="pb-2 text-right font-normal">Min stake</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 tabular-nums">
          {timedDurations.map((item) => (
            <tr key={item.seconds}>
              <td className="py-2 text-white">{formatDuration(item.seconds)}</td>
              <td className="py-2 text-right text-up">{Math.round(item.payoutRate * 100)}%</td>
              <td className="py-2 text-right text-neutral-300">{formatUsdt(item.minAmount)} USDT</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SummaryList
        items={[
          { label: "Available", value: orders?.signedIn ? `${formatUsdt(orders.available)} USDT` : "--" },
          { label: "Open trades", value: openCount },
        ]}
      />

      {!enabled && <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">Options trading on this pair is paused by the admin.</p>}

      <div className="grid grid-cols-2 gap-3">
        {directions.map((item) => (
          <GradientButton key={item.value} variant={item.variant} size="lg" disabled={!enabled} onClick={() => handleOpen(item.value)}>
            <item.icon className="size-4" />
            {directionLabels[item.value]}
          </GradientButton>
        ))}
      </div>

      <p className="mt-auto text-2xs leading-4 text-neutral-500">Orders settle at the Binance market price when the timer ends. Equal prices refund your stake.</p>

      <TimedOrderSheet symbol={symbol} direction={direction} open={sheetOpen} onOpenChange={setSheetOpen} onPlaced={handlePlaced} />
      <TimedOrderOverlay orderId={placedId} open={overlayOpen} onClose={handleOverlayClose} />
    </div>
  );
};
