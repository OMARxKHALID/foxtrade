"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { ChangePill } from "@/components/ui/change-pill";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { useLiveTickers } from "@/hooks/use-live-tickers";
import { allSymbols, pairBySymbol } from "@/lib/market/pairs";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/store/use-preferences-store";
import { PairCell, compactText, marketColumns, mutedPrice, priceText, tickerSortValues } from "@/features/market/components/market-cells";

const markets = [
  { value: "perpetual", label: "Option", path: "perpetual" },
  { value: "timed", label: "Futures", path: "timed" },
  { value: "favorites", label: "Favorites", path: "perpetual" },
];

const columns = [...marketColumns, { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" }];

export const MarketsTable = ({ settings = {} }) => {
  const [market, setMarket] = useState("perpetual");
  const favorites = usePreferencesStore((state) => state.favorites);
  const toggleFavorite = usePreferencesStore((state) => state.toggleFavorite);
  const tickers = useLiveTickers(allSymbols);
  const path = markets.find((item) => item.value === market).path;

  const rows = tickers
    .filter((ticker) => market !== "favorites" || favorites.includes(ticker.symbol))
    .filter((ticker) => {
      const setting = settings[ticker.symbol];
      if (!setting) return true;
      return path === "timed" ? setting.timedEnabled : setting.perpetualEnabled;
    })
    .map((ticker) => {
      const pair = pairBySymbol[ticker.symbol];
      const favorite = favorites.includes(ticker.symbol);
      const href = `/trade/${path}/${ticker.symbol.toLowerCase()}`;
      return {
        id: ticker.symbol,
        searchText: `${pair.base} ${pair.name}`,
        sortValues: tickerSortValues(ticker),
        cells: {
          pair: <PairCell pair={pair} href={href} />,
          price: priceText(ticker.price),
          change: <ChangePill value={ticker.changePercent} />,
          high: mutedPrice(ticker.high),
          low: mutedPrice(ticker.low),
          turnover: compactText(ticker.quoteVolume),
          actions: (
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFavorite(ticker.symbol)}
                aria-pressed={favorite}
                aria-label={favorite ? `Remove ${pair.base} from favorites` : `Add ${pair.base} to favorites`}
                className="flex size-8 items-center justify-center"
              >
                <Star className={cn("size-4", favorite ? "fill-brand text-brand" : "text-neutral-600")} />
              </button>
              <GradientButton href={href} variant="dark" size="xs" className="hidden sm:inline-flex">
                Trade
              </GradientButton>
            </span>
          ),
        },
      };
    });

  return (
    <DataTable
      key={market}
      tabs={<SegmentedTabs items={markets} value={market} onChange={setMarket} variant="pill" label="Market type" />}
      searchPlaceholder="Search coin"
      columns={columns}
      rows={rows}
      pageSize={10}
      initialSort={{ key: "turnover", direction: "desc" }}
      emptyState={
        <EmptyState
          icon={Star}
          title={market === "favorites" ? "No favorites yet" : "No pairs available"}
          text={market === "favorites" ? "Tap the star next to a pair to pin it here." : undefined}
          className="py-10"
        />
      }
    />
  );
};
