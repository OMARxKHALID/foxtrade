"use client";

import { useEffect, useRef, useState } from "react";
import { CardHeader } from "@/components/ui/glow-card";
import { subscribeStream } from "@/lib/market/binance-socket";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const LIMIT = 40;

const rowGrid = "grid grid-cols-3 gap-2 px-4";

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const TradeFeed = ({ symbol, className }) => {
  const [trades, setTrades] = useState([]);
  const buffer = useRef([]);
  const frame = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeStream(`${symbol.toLowerCase()}@aggTrade`, (data) => {
      buffer.current = [{ id: data.a, price: +data.p, quantity: +data.q, time: data.T, sell: data.m }, ...buffer.current].slice(0, LIMIT);
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setTrades(buffer.current));
    });
    return () => {
      cancelAnimationFrame(frame.current);
      unsubscribe();
    };
  }, [symbol]);

  return (
    <section aria-label="Recent trades" className={cn("flex flex-col", className)}>
      <CardHeader title="Last trades" size="sm" as="h2" />
      <div className={cn("py-2 text-[11px] text-neutral-500", rowGrid)}>
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>
      {trades.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-xs text-neutral-500">Waiting for trades…</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-hidden">
          {trades.map((trade) => (
            <li key={trade.id} className={cn("h-5 items-center text-[11px] tabular-nums", rowGrid)}>
              <span className={trade.sell ? "text-down" : "text-up"}>{formatPrice(trade.price)}</span>
              <span className="text-right text-neutral-300">{trade.quantity.toFixed(4)}</span>
              <span className="text-right text-neutral-500">{timeFormat.format(trade.time)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
