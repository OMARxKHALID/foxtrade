"use client";

import Link from "next/link";
import { CandlestickChart, Timer } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, GlowCard } from "@/components/ui/glow-card";
import { useMarkPrices } from "@/hooks/use-mark-prices";
import { useNow } from "@/hooks/use-now";
import { formatPrice, formatUsdt } from "@/lib/format";
import { SideText, SignedAmount, pairLabel, unrealizedPnl } from "@/features/trading/components/trade-format";

const rowClass = "flex items-center justify-between gap-3 px-4 py-3 sm:px-6";

export const OpenActivity = ({ positions, timed }) => {
  const marks = useMarkPrices([...positions, ...timed].map((item) => item.symbol));
  const now = useNow(timed.length > 0);
  const totalPnl = positions.filter((item) => item.status === "open").reduce((sum, item) => sum + unrealizedPnl(item, marks[item.symbol]), 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
      <GlowCard as="section" aria-labelledby="open-positions-title" className="overflow-hidden">
        <CardHeader
          id="open-positions-title"
          title={`Open positions (${positions.length})`}
          actions={positions.length ? <SignedAmount value={totalPnl} className="text-sm" /> : <Link href="/trade/perpetual/btcusdt" className="text-xs text-brand">Open a position</Link>}
        />
        {positions.length ? (
          <ul className="divide-y divide-white/5">
            {positions.map((item) => (
              <li key={item.id}>
                <Link href={`/trade/perpetual/orders/${item.id}`} className={rowClass}>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">{pairLabel(item.symbol)}</span>
                    <span className="block text-xs text-neutral-500">
                      <SideText value={item.side} /> {item.leverage}x · {item.status === "pending" ? `limit ${formatPrice(item.limitPrice)}` : `entry ${formatPrice(item.entryPrice)}`}
                    </span>
                  </span>
                  {item.status === "pending" ? <span className="text-xs text-warning">Pending</span> : <SignedAmount value={unrealizedPnl(item, marks[item.symbol])} className="text-sm" />}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={CandlestickChart} title="No open positions" text="Leveraged positions you open appear here with live PnL." />
        )}
      </GlowCard>
      <GlowCard as="section" aria-labelledby="open-timed-title" className="overflow-hidden">
        <CardHeader id="open-timed-title" title={`Open timed trades (${timed.length})`} actions={<Link href="/trade/timed/btcusdt" className="text-xs text-brand">Trade futures</Link>} />
        {timed.length ? (
          <ul className="divide-y divide-white/5">
            {timed.map((item) => {
              const left = Math.max(0, Math.ceil((new Date(item.expiresAt).getTime() - now) / 1000));
              const mark = marks[item.symbol];
              const winning = mark ? (item.direction === "call" ? mark > item.openPrice : mark < item.openPrice) : null;
              return (
                <li key={item.id}>
                  <Link href={`/trade/timed/orders/${item.id}`} className={rowClass}>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-white">{pairLabel(item.symbol)}</span>
                      <span className="block text-xs text-neutral-500">
                        <SideText value={item.direction} /> · {formatUsdt(item.amount)} USDT
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-medium text-white tabular-nums">{left ? `${left}s` : "Settling…"}</span>
                      <span className={winning === null ? "text-xs text-neutral-500" : winning ? "text-xs text-up" : "text-xs text-down"}>
                        {winning === null ? "--" : winning ? "Winning" : "Losing"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={Timer} title="No open timed trades" text="Call or Put trades count down here until they settle." />
        )}
      </GlowCard>
    </div>
  );
};
