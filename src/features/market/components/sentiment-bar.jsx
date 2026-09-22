"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { subscribeStream } from "@/lib/market/binance-socket";
import { cn } from "@/lib/utils";

const DEPTH = 20;

const depthTotal = (levels) => levels.slice(0, DEPTH).reduce((total, [, quantity]) => total + Number(quantity), 0);

export const SentimentBar = ({ symbol, className }) => {
  const [buyShare, setBuyShare] = useState(null);
  const frame = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeStream(`${symbol.toLowerCase()}@depth20@100ms`, (data) => {
      const bids = depthTotal(data.bids);
      const total = bids + depthTotal(data.asks);
      if (!total) return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setBuyShare(Math.round((bids / total) * 100)));
    });
    return () => {
      cancelAnimationFrame(frame.current);
      unsubscribe();
    };
  }, [symbol]);

  const buy = buyShare ?? 50;
  const sell = 100 - buy;

  return (
    <div className={cn("flex flex-col gap-1.5", className)} role="group" aria-label="Order book sentiment">
      <div className="flex items-center justify-between text-2xs">
        <span className="flex items-center gap-1 text-up">
          <TrendingUp className="size-3.5" />
          Buy
        </span>
        <span className="text-neutral-500">Order book depth</span>
        <span className="flex items-center gap-1 text-down">
          Sell
          <TrendingDown className="size-3.5" />
        </span>
      </div>
      <div className="flex h-6 gap-1 text-2xs font-semibold tabular-nums">
        <span className="flex min-w-12 basis-0 items-center rounded-l-full bg-up pl-3 text-black transition-[flex-grow] duration-300" style={{ flexGrow: buy }}>
          {buyShare === null ? "--" : `${buy}%`}
        </span>
        <span className="flex min-w-12 basis-0 items-center justify-end rounded-r-full bg-down pr-3 text-white transition-[flex-grow] duration-300" style={{ flexGrow: sell }}>
          {buyShare === null ? "--" : `${sell}%`}
        </span>
      </div>
    </div>
  );
};
