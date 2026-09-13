"use client";

import { useEffect, useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { subscribeStream } from "@/lib/market/binance-socket";
import { tickersQuery } from "@/lib/market/market-queries";
import { useTickerStore } from "@/store/use-ticker-store";

const fromMiniTicker = ({ s, c, o, h, l, v, q }) => {
  const price = Number(c);
  const open = Number(o);
  return {
    symbol: s,
    price,
    open,
    high: Number(h),
    low: Number(l),
    volume: Number(v),
    quoteVolume: Number(q),
    changePercent: open ? ((price - open) / open) * 100 : 0,
  };
};

export const useLiveTickers = (symbols) => {
  const { data: snapshot } = useSuspenseQuery(tickersQuery(symbols));
  const applyBatch = useTickerStore((state) => state.applyBatch);
  const key = symbols.join(",");

  useEffect(() => {
    const tracked = new Set(key.split(","));
    return subscribeStream("!miniTicker@arr", (payload) => {
      applyBatch(payload.filter((item) => tracked.has(item.s)).map(fromMiniTicker));
    });
  }, [key, applyBatch]);

  const live = useTickerStore(useShallow((state) => symbols.map((symbol) => state.tickers[symbol])));

  return useMemo(() => {
    const bySymbol = Object.fromEntries(snapshot.map((ticker) => [ticker.symbol, ticker]));
    return symbols.map((symbol, i) => live[i] ?? bySymbol[symbol]).filter(Boolean);
  }, [snapshot, live, symbols]);
};
