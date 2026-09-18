"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { GradientButton } from "@/components/ui/gradient-button";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { formatPrice } from "@/lib/format";
import { pairLabel } from "@/lib/market/pairs";
import { PerpetualOrderForm } from "@/features/trading/components/perpetual-order-form";

const sides = [
  { value: "long", label: "Open Long", variant: "up", icon: ArrowUpRight },
  { value: "short", label: "Open Short", variant: "down", icon: ArrowDownRight },
];

export const PerpetualOrderPanel = ({ symbol, enabled = true, maxLeverage }) => {
  const [ticker] = useLiveTickers([symbol]);
  const [side, setSide] = useState(null);

  const handleOpen = (value) => setSide(value);
  const handleSheetChange = (value) => {
    if (!value) setSide(null);
  };
  const handlePlaced = () => setSide(null);

  return (
    <>
      <div className="hidden md:block">
        <PerpetualOrderForm symbol={symbol} enabled={enabled} maxLeverage={maxLeverage} />
      </div>

      <div className="flex flex-col gap-3 p-4 md:hidden">
        {!enabled && <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">Futures trading on this pair is paused by the admin.</p>}
        <div className="grid grid-cols-2 gap-3">
          {sides.map((item) => (
            <GradientButton key={item.value} variant={item.variant} size="lg" disabled={!enabled} onClick={() => handleOpen(item.value)}>
              <item.icon className="size-4" />
              {item.label}
            </GradientButton>
          ))}
        </div>
      </div>

      <BottomSheet open={Boolean(side)} onOpenChange={handleSheetChange} title={pairLabel(symbol)} description={ticker ? formatPrice(ticker.price) : "--"}>
        {side && <PerpetualOrderForm key={side} symbol={symbol} enabled={enabled} maxLeverage={maxLeverage} defaultSide={side} onPlaced={handlePlaced} className="p-0 sm:p-0" />}
      </BottomSheet>
    </>
  );
};
