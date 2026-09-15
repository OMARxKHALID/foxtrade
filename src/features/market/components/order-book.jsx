"use client";

import { useEffect, useRef, useState } from "react";
import { CardHeader } from "@/components/ui/glow-card";
import { subscribeStream } from "@/lib/market/binance-socket";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const DEPTH = 20;

const toLevels = (levels) => levels.slice(0, DEPTH).map(([price, quantity]) => ({ price: +price, quantity: +quantity }));

const withTotals = (levels) => {
  let running = 0;
  return levels.map((level) => {
    running += level.quantity;
    return { ...level, total: running };
  });
};

const rowGrid = "grid grid-cols-3 gap-2 px-4";

const Row = ({ level, max, side }) => (
  <li className={cn("relative h-5 shrink-0 items-center text-[11px] tabular-nums", rowGrid)}>
    <span
      className={cn("absolute inset-y-0 right-0", side === "ask" ? "bg-down/10" : "bg-up/10")}
      style={{ width: `${Math.min(100, (level.total / max) * 100)}%` }}
    />
    <span className={cn("relative", side === "ask" ? "text-down" : "text-up")}>{formatPrice(level.price)}</span>
    <span className="relative text-right text-neutral-300">{level.quantity.toFixed(4)}</span>
    <span className="relative text-right text-neutral-500">{level.total.toFixed(3)}</span>
  </li>
);

export const OrderBook = ({ symbol, className }) => {
  const [book, setBook] = useState({ bids: [], asks: [] });
  const frame = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeStream(`${symbol.toLowerCase()}@depth20@100ms`, (data) => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setBook({ bids: toLevels(data.bids), asks: toLevels(data.asks) }));
    });
    return () => {
      cancelAnimationFrame(frame.current);
      unsubscribe();
    };
  }, [symbol]);

  const asks = withTotals(book.asks);
  const bids = withTotals(book.bids);
  const max = Math.max(asks.at(-1)?.total ?? 0, bids.at(-1)?.total ?? 0) || 1;
  const spread = asks[0] && bids[0] ? asks[0].price - bids[0].price : null;
  const mid = bids[0] && asks[0] ? (bids[0].price + asks[0].price) / 2 : null;

  return (
    <section aria-label="Order book" className={cn("flex flex-col", className)}>
      <CardHeader title="Order book" size="sm" as="h2" />
      <div className={cn("py-2 text-[11px] text-neutral-500", rowGrid)}>
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Total</span>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col-reverse overflow-hidden">
        {asks.map((level) => (
          <Row key={`a${level.price}`} level={level} max={max} side="ask" />
        ))}
      </ul>
      <div className="flex shrink-0 items-center justify-between border-y border-white/10 px-4 py-2">
        <span className="font-heading text-base font-semibold text-white tabular-nums">{mid ? formatPrice(mid) : "--"}</span>
        <span className="text-[11px] text-neutral-500">Spread {spread === null ? "--" : formatPrice(spread)}</span>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {bids.map((level) => (
          <Row key={`b${level.price}`} level={level} max={max} side="bid" />
        ))}
      </ul>
    </section>
  );
};
