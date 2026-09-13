"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeStream } from "@/lib/market/binance-socket";

export const useMarkPrices = (symbols) => {
  const [prices, setPrices] = useState({});
  const key = [...new Set(symbols)].sort().join(",");
  const frame = useRef(0);

  useEffect(() => {
    if (!key) return;
    const tracked = new Set(key.split(","));
    const unsubscribe = subscribeStream("!miniTicker@arr", (payload) => {
      const updates = payload.filter((item) => tracked.has(item.s));
      if (!updates.length) return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() =>
        setPrices((current) => ({ ...current, ...Object.fromEntries(updates.map((item) => [item.s, Number(item.c)])) })),
      );
    });
    return () => {
      cancelAnimationFrame(frame.current);
      unsubscribe();
    };
  }, [key]);

  return prices;
};
