"use client";

import Link from "next/link";
import { CoinIcon } from "@/components/icons/coin-icon";
import { ChangePill } from "@/components/ui/change-pill";
import { GlowCard } from "@/components/ui/glow-card";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { formatCompact, formatPrice } from "@/lib/format";
import { featuredSymbols, pairBySymbol } from "@/lib/market/pairs";
import { cn } from "@/lib/utils";

export const TickerTrio = () => {
  const tickers = useLiveTickers(featuredSymbols);

  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
      {tickers.map((ticker) => {
        const pair = pairBySymbol[ticker.symbol];
        const up = ticker.changePercent >= 0;
        return (
          <li key={ticker.symbol} className="min-w-0">
            <GlowCard className="h-full">
              <Link href={`/trade/perpetual/${ticker.symbol.toLowerCase()}`} className="flex h-full min-w-0 flex-col gap-1.5 p-3 sm:gap-2 sm:p-6">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <CoinIcon symbol={pair.base} color={pair.color} size="sm" className="hidden sm:flex" />
                    <span className="truncate text-xs font-medium text-white sm:text-sm">
                      {pair.base}/{pair.quote}
                    </span>
                  </span>
                  <ChangePill value={ticker.changePercent} size="sm" className="self-start sm:self-auto" />
                </div>
                <p className={cn("truncate font-heading text-sm font-semibold tabular-nums sm:text-2xl", up ? "text-up" : "text-down")}>
                  {formatPrice(ticker.price)}
                </p>
                <p className="hidden text-xs text-neutral-500 sm:block">
                  24h Vol <span className="text-neutral-300">{formatCompact(ticker.quoteVolume)}</span>
                </p>
              </Link>
            </GlowCard>
          </li>
        );
      })}
    </ul>
  );
};
