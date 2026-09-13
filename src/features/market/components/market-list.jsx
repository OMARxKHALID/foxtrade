"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ChangePill } from "@/components/ui/change-pill";
import { DataTable } from "@/components/ui/data-table";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { allSymbols, pairBySymbol } from "@/lib/market/pairs";
import { PairCell, compactText, marketColumns, mutedPrice, priceText, tickerSortValues } from "@/features/market/components/market-cells";

const tabs = [
  { value: "gainers", label: "Top Gainers", sort: (a, b) => b.changePercent - a.changePercent },
  { value: "losers", label: "Top Losers", sort: (a, b) => a.changePercent - b.changePercent },
  { value: "turnover", label: "24h Turnover", sort: (a, b) => b.quoteVolume - a.quoteVolume },
];

export const MarketList = ({ settings = {} }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const tickers = useLiveTickers(allSymbols);
  const tab = tabs.find((item) => item.value === activeTab);

  const rows = [...tickers]
    .filter((ticker) => settings[ticker.symbol]?.perpetualEnabled !== false || settings[ticker.symbol]?.timedEnabled !== false)
    .sort(tab.sort)
    .map((ticker) => {
    const pair = pairBySymbol[ticker.symbol];
    const market = settings[ticker.symbol]?.perpetualEnabled === false ? "timed" : "perpetual";
    return {
      id: ticker.symbol,
      searchText: `${pair.base} ${pair.name}`,
      sortValues: tickerSortValues(ticker),
      cells: {
        pair: <PairCell pair={pair} href={`/trade/${market}/${ticker.symbol.toLowerCase()}`} />,
        price: priceText(ticker.price),
        change: <ChangePill value={ticker.changePercent} />,
        high: mutedPrice(ticker.high),
        low: mutedPrice(ticker.low),
        turnover: compactText(ticker.quoteVolume),
      },
    };
  });

  return (
    <DataTable
      key={activeTab}
      tabs={<SegmentedTabs items={tabs} value={activeTab} onChange={setActiveTab} variant="pill" label="Market overview" />}
      searchPlaceholder="Search coin"
      columns={marketColumns}
      rows={rows}
      footer={
        <Link href="/markets" className="flex items-center justify-center gap-1 border-t border-white/10 py-3 text-xs text-neutral-400">
          View all markets
          <ChevronRight className="size-3.5" />
        </Link>
      }
    />
  );
};
