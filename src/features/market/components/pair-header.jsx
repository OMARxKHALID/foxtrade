"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { BookOpen, ChevronDown } from "lucide-react";
import { CoinIcon } from "@/components/icons/coin-icon";
import { ChangePill } from "@/components/ui/change-pill";
import { menuItemClass, menuPopupClass, menuSideOffset } from "@/components/ui/menu-styles";
import { SentimentBar } from "@/features/market/components/sentiment-bar";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { formatCompact, formatPrice } from "@/lib/format";
import { usePlatform } from "@/hooks/use-platform";
import { cn } from "@/lib/utils";

const Stat = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-2xs text-neutral-500">{label}</span>
    <span className="text-xs text-white tabular-nums">{value}</span>
  </div>
);

export const PairHeader = ({ symbol, market }) => {
  const [ticker] = useLiveTickers([symbol]);
  const { pairs, pairBySymbol } = usePlatform();
  const marketPairs = pairs.filter((item) => (market === "timed" ? item.timedEnabled : item.perpetualEnabled) || item.symbol === symbol);
  const pair = pairBySymbol[symbol];
  const up = (ticker?.changePercent ?? 0) >= 0;

  return (
    <div className="relative flex flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:flex-wrap md:items-center md:gap-x-8">
      <div className="flex items-center justify-between gap-4 md:contents">
      <Menu.Root>
        <Menu.Trigger aria-label={`Change market, currently ${pair.base}/${pair.quote}`} className="group flex min-w-0 cursor-pointer items-center gap-3 outline-none">
          <CoinIcon symbol={pair.base} color={pair.color} />
          <span className="text-left">
            <span className="flex items-center gap-1 font-heading text-base font-semibold text-white">
              {pair.base}/{pair.quote}
              <ChevronDown className="size-4 text-neutral-400 transition-transform group-data-[popup-open]:rotate-180" />
            </span>
            <span className="block text-2xs text-neutral-500">{market === "timed" ? "Options · Timed" : "Futures · Perpetual"}</span>
          </span>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={menuSideOffset} align="start" className="z-50 outline-none">
            <Menu.Popup className={cn("max-h-80 w-[min(18rem,calc(100vw-2rem))] overflow-y-auto", menuPopupClass)}>
              {marketPairs.map((item) => (
                <Menu.Item
                  key={item.symbol}
                  className={cn(menuItemClass, item.symbol === symbol && "bg-white/5 text-brand")}
                  render={<Link href={`/trade/${market}/${item.symbol.toLowerCase()}`} />}
                >
                  <CoinIcon symbol={item.base} color={item.color} size="sm" />
                  {item.base}/{item.quote}
                  <span className="ml-auto text-xs text-neutral-500">{item.name}</span>
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
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
      <SentimentBar symbol={symbol} className="w-full md:order-last md:basis-full" />
      <Link href={`/trade/rules/${market}`} className="inline-flex items-center gap-1.5 self-start text-xs text-neutral-400 md:ml-auto md:self-center">
        <BookOpen className="size-3.5" />
        Trading Rules
      </Link>
    </div>
  );
};
