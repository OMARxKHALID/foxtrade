"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown } from "lucide-react";
import { CoinIcon } from "@/components/icons/coin-icon";
import { ChangePill } from "@/components/ui/change-pill";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { formatCompact, formatPrice } from "@/lib/format";
import { defaultPairs, pairBySymbol } from "@/lib/market/pairs";
import { cn } from "@/lib/utils";

const Stat = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] text-neutral-500">{label}</span>
    <span className="text-xs text-white tabular-nums">{value}</span>
  </div>
);

export const PairHeader = ({ symbol, market }) => {
  const [open, setOpen] = useState(false);
  const [ticker] = useLiveTickers([symbol]);
  const pair = pairBySymbol[symbol];
  const up = (ticker?.changePercent ?? 0) >= 0;

  const handleToggle = () => setOpen((value) => !value);
  const handleClose = () => setOpen(false);

  return (
    <div className="relative flex flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:flex-wrap md:items-center md:gap-x-8">
      <div className="flex items-center justify-between gap-4 md:contents">
      <button type="button" onClick={handleToggle} aria-expanded={open} className="flex min-w-0 items-center gap-3">
        <CoinIcon symbol={pair.base} color={pair.color} />
        <span className="text-left">
          <span className="flex items-center gap-1 font-heading text-base font-semibold text-white">
            {pair.base}/{pair.quote}
            <ChevronDown className={cn("size-4 text-neutral-400 transition-transform", open && "rotate-180")} />
          </span>
          <span className="block text-[11px] text-neutral-500">{market === "timed" ? "Options · Timed" : "Futures · Perpetual"}</span>
        </span>
      </button>
      <div className="flex min-w-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
        <span className={cn("font-heading text-lg font-semibold tabular-nums sm:text-xl", up ? "text-up" : "text-down")}>
          {ticker ? formatPrice(ticker.price) : "--"}
        </span>
        {ticker && <ChangePill value={ticker.changePercent} size="sm" />}
      </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 md:flex md:gap-6">
        <Stat label="24h High" value={ticker ? formatPrice(ticker.high) : "--"} />
        <Stat label="24h Low" value={ticker ? formatPrice(ticker.low) : "--"} />
        <Stat label="24h Volume" value={ticker ? formatCompact(ticker.volume) : "--"} />
        <Stat label="24h Turnover" value={ticker ? formatCompact(ticker.quoteVolume) : "--"} />
      </div>
      <Link href={`/trade/rules/${market}`} className="inline-flex items-center gap-1.5 self-start text-xs text-neutral-400 md:ml-auto md:self-center">
        <BookOpen className="size-3.5" />
        Trading Rules
      </Link>
      {open && (
        <div className="absolute top-full left-3 z-30 mt-1 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-field">
          <ul className="max-h-80 overflow-y-auto py-1">
            {defaultPairs.map((item) => (
              <li key={item.symbol}>
                <Link
                  href={`/trade/${market}/${item.symbol.toLowerCase()}`}
                  onClick={handleClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm",
                    item.symbol === symbol ? "bg-white/5 text-brand" : "text-white",
                  )}
                >
                  <CoinIcon symbol={item.base} color={item.color} size="sm" />
                  {item.base}/{item.quote}
                  <span className="ml-auto text-xs text-neutral-500">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
