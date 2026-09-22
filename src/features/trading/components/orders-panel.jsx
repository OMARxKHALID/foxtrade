"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { GradientButton } from "@/components/ui/gradient-button";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { IconButton } from "@/components/ui/icon-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useMarkPrices } from "@/hooks/use-mark-prices";
import { useNow } from "@/hooks/use-now";
import { usePlatform } from "@/hooks/use-platform";
import { formatPercent, formatPrice, formatQuantity, formatUsdt } from "@/lib/format";
import { cancelOrder, closeAllPositions, closePosition } from "@/features/trading/actions/place-order";
import { AddMarginDialog } from "@/features/trading/components/add-margin-dialog";
import {
  SideText,
  SignedAmount,
  Status,
  closeReasons,
  dateTime,
  directionLabels,
  pairLabel,
  positionStatus,
  timedStatus,
  unrealizedPnl,
} from "@/features/trading/components/trade-format";
import { ordersQuery, tradingKeys } from "@/features/trading/queries/trading-queries";

const tabsByMarket = {
  perpetual: [
    { value: "positions", label: "Positions" },
    { value: "orders", label: "Open Orders" },
    { value: "history", label: "History" },
  ],
  timed: [
    { value: "open", label: "Open Trades" },
    { value: "history", label: "History" },
  ],
};

const columns = {
  open: [
    { key: "pair", header: "Pair", sortable: true },
    { key: "direction", header: "Direction" },
    { key: "amount", header: "Stake", align: "right", sortable: true },
    { key: "open", header: "Open Price", align: "right", hideBelow: "sm" },
    { key: "mark", header: "Live Price", align: "right", hideBelow: "md" },
    { key: "remaining", header: "Time Left", align: "right" },
  ],
  timedHistory: [
    { key: "pair", header: "Pair", sortable: true },
    { key: "direction", header: "Direction" },
    { key: "amount", header: "Stake", align: "right", hideBelow: "sm" },
    { key: "prices", header: "Open → Close", align: "right", hideBelow: "md" },
    { key: "time", header: "Settled", align: "right", sortable: true, hideBelow: "lg" },
    { key: "result", header: "Result", align: "right" },
  ],
  positions: [
    { key: "pair", header: "Pair", sortable: true },
    { key: "size", header: "Size", align: "right", hideBelow: "sm" },
    { key: "entry", header: "Entry", align: "right", hideBelow: "md" },
    { key: "mark", header: "Mark", align: "right", hideBelow: "md" },
    { key: "liquidation", header: "Liq. Price", align: "right", hideBelow: "lg" },
    { key: "margin", header: "Margin", align: "right", hideBelow: "lg" },
    { key: "pnl", header: "PnL", align: "right", sortable: true },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
  ],
  orders: [
    { key: "pair", header: "Pair", sortable: true },
    { key: "limit", header: "Limit Price", align: "right" },
    { key: "margin", header: "Margin", align: "right", hideBelow: "sm" },
    { key: "created", header: "Placed", align: "right", hideBelow: "md" },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
  ],
  perpetualHistory: [
    { key: "pair", header: "Pair", sortable: true },
    { key: "prices", header: "Entry → Exit", align: "right", hideBelow: "md" },
    { key: "reason", header: "Closed By", hideBelow: "sm" },
    { key: "time", header: "Closed", align: "right", sortable: true, hideBelow: "lg" },
    { key: "pnl", header: "PnL", align: "right" },
  ],
};


const formatRemaining = (ms) => {
  if (ms <= 0) return "Settling…";
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return minutes ? `${minutes}:${seconds}` : `${total}s`;
};

const PairLink = ({ market, item, children }) => (
  <Link href={`/trade/${market}/orders/${item.id}`} className="block">
    <span className="block font-medium text-white">{pairLabel(item.symbol)}</span>
    {children && <span className="block text-xs text-neutral-500">{children}</span>}
  </Link>
);

const useSettlementToasts = (market, items) => {
  const previous = useRef(null);

  useEffect(() => {
    if (!items) return;
    const statuses = Object.fromEntries(items.map((item) => [item.id, item.status]));
    if (previous.current) {
      items.forEach((item) => {
        const before = previous.current[item.id];
        if (!before || before === item.status || !["open", "pending"].includes(before)) return;
        const pair = pairLabel(item.symbol);
        if (market === "timed") {
          const profit = (item.payout ?? 0) - item.amount;
          if (item.status === "won") toast.success(`${pair} ${directionLabels[item.direction]} won`, { description: `+${formatUsdt(profit)} USDT` });
          if (item.status === "lost") toast.error(`${pair} ${directionLabels[item.direction]} lost`, { description: `-${formatUsdt(item.amount)} USDT` });
          if (item.status === "draw") toast(`${pair} ${directionLabels[item.direction]} ended in a draw`, { description: "Stake refunded" });
          return;
        }
        if (item.status === "open") toast.success(`${pair} limit order filled`);
        if (item.status === "liquidated") toast.error(`${pair} position liquidated`);
        if (item.status === "closed" && item.closeReason !== "manual") toast(`${pair} ${closeReasons[item.closeReason]?.toLowerCase()} hit`, { description: `PnL ${formatUsdt(item.pnl)} USDT` });
      });
    }
    previous.current = statuses;
  }, [items, market]);
};

export const OrdersPanel = ({ market }) => {
  const tabs = tabsByMarket[market];
  const [tab, setTab] = useState(tabs[0].value);
  const [marginTarget, setMarginTarget] = useState(null);
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);
  const queryClient = useQueryClient();
  const { takerFeeRate } = usePlatform().settings;
  const { data, isPending, isError, error } = useQuery(ordersQuery(market));
  const items = data?.items;
  useSettlementToasts(market, items);

  const refresh = () => queryClient.invalidateQueries({ queryKey: tradingKeys.orders(market) });
  const close = useActionSubmit({ action: closePosition, successMessage: "Position closed.", onSuccess: refresh });
  const cancel = useActionSubmit({ action: cancelOrder, successMessage: "Order cancelled.", onSuccess: refresh });
  const closeAll = useActionSubmit({
    action: closeAllPositions,
    onSuccess: ({ data }) => {
      if (data.closed === data.total) toast.success("All positions closed.");
      if (data.closed < data.total) toast.warning(`Closed ${data.closed} of ${data.total} positions. Try again for the rest.`);
      setConfirmCloseAll(false);
      refresh();
    },
  });

  const list = items ?? [];
  const active = list.filter((item) => ["open", "pending"].includes(item.status));
  const marks = useMarkPrices(active.map((item) => item.symbol));
  const now = useNow(market === "timed" && active.length > 0);

  const openTimed = list.filter((item) => item.status === "open");
  const openPositions = list.filter((item) => item.status === "open");
  const pendingOrders = list.filter((item) => item.status === "pending");

  const view = {
    open: {
      columns: columns.open,
      rows: openTimed.map((item) => {
        const mark = marks[item.symbol];
        const winning = mark ? (item.direction === "call" ? mark > item.openPrice : mark < item.openPrice) : null;
        return {
          id: item.id,
          searchText: pairLabel(item.symbol),
          sortValues: { pair: item.symbol, amount: item.amount },
          cells: {
            pair: <PairLink market={market} item={item}>{item.duration}s · {Math.round(item.payoutRate * 100)}%</PairLink>,
            direction: <SideText value={item.direction} />,
            amount: <span className="text-white tabular-nums">{formatUsdt(item.amount)}</span>,
            open: <span className="tabular-nums">{formatPrice(item.openPrice)}</span>,
            mark: <span className={winning === null ? "text-neutral-400" : winning ? "text-up" : "text-down"}>{mark ? formatPrice(mark) : "--"}</span>,
            remaining: <span className="font-medium text-white tabular-nums">{formatRemaining(new Date(item.expiresAt).getTime() - now)}</span>,
          },
        };
      }),
      empty: { title: "No open trades", text: "Choose Call or Put to place a timed trade." },
    },
    history:
      market === "timed"
        ? {
            columns: columns.timedHistory,
            rows: list
              .filter((item) => item.status !== "open")
              .map((item) => ({
                id: item.id,
                searchText: `${pairLabel(item.symbol)} ${item.status}`,
                sortValues: { pair: item.symbol, time: item.settledAt ?? item.expiresAt },
                cells: {
                  pair: <PairLink market={market} item={item}>{item.duration}s</PairLink>,
                  direction: <SideText value={item.direction} />,
                  amount: <span className="tabular-nums">{formatUsdt(item.amount)}</span>,
                  prices: <span className="tabular-nums text-neutral-300">{formatPrice(item.openPrice)} → {item.closePrice ? formatPrice(item.closePrice) : "--"}</span>,
                  time: <span className="text-neutral-400">{dateTime.format(new Date(item.settledAt ?? item.expiresAt))}</span>,
                  result: (
                    <span className="inline-flex flex-col items-end gap-1">
                      <Status map={timedStatus} value={item.status} />
                      {item.status !== "cancelled" && <SignedAmount value={(item.payout ?? 0) - item.amount} className="text-xs" />}
                    </span>
                  ),
                },
              })),
            empty: { title: "No settled trades yet", text: "Finished timed trades appear here with their result." },
          }
        : {
            columns: columns.perpetualHistory,
            rows: list
              .filter((item) => ["closed", "liquidated", "cancelled"].includes(item.status))
              .map((item) => ({
                id: item.id,
                searchText: `${pairLabel(item.symbol)} ${item.status}`,
                sortValues: { pair: item.symbol, time: item.closedAt },
                cells: {
                  pair: (
                    <PairLink market={market} item={item}>
                      <SideText value={item.side} /> {item.leverage}x
                    </PairLink>
                  ),
                  prices: <span className="tabular-nums text-neutral-300">{formatPrice(item.entryPrice)} → {item.exitPrice ? formatPrice(item.exitPrice) : "--"}</span>,
                  reason: item.status === "cancelled" ? <Status map={positionStatus} value="cancelled" /> : <span className="text-neutral-300">{closeReasons[item.closeReason] ?? "--"}</span>,
                  time: <span className="text-neutral-400">{item.closedAt ? dateTime.format(new Date(item.closedAt)) : "--"}</span>,
                  pnl: item.status === "cancelled" ? <span className="text-neutral-500">--</span> : <SignedAmount value={item.pnl} />,
                },
              })),
            empty: { title: "No closed positions", text: "Closed and liquidated positions appear here." },
          },
    positions: {
      columns: columns.positions,
      rows: openPositions.map((item) => {
        const mark = marks[item.symbol];
        const pnl = unrealizedPnl(item, mark, takerFeeRate);
        return {
          id: item.id,
          searchText: pairLabel(item.symbol),
          sortValues: { pair: item.symbol, pnl },
          cells: {
            pair: (
              <PairLink market={market} item={item}>
                <SideText value={item.side} /> {item.leverage}x
              </PairLink>
            ),
            size: <span className="tabular-nums">{formatQuantity(item.size)}</span>,
            entry: <span className="tabular-nums">{formatPrice(item.entryPrice)}</span>,
            mark: <span className="tabular-nums text-white">{mark ? formatPrice(mark) : "--"}</span>,
            liquidation: <span className="tabular-nums text-down">{formatPrice(item.liquidationPrice)}</span>,
            margin: <span className="tabular-nums">{formatUsdt(item.margin)}</span>,
            pnl: (
              <span className="inline-flex flex-col items-end">
                <SignedAmount value={pnl} suffix="" />
                <span className="text-2xs text-neutral-500 tabular-nums">{formatPercent((pnl / item.margin) * 100)}</span>
              </span>
            ),
            actions: (
              <span className="inline-flex gap-2">
                <IconButton label={`Add margin to ${pairLabel(item.symbol)}`} onClick={() => setMarginTarget(item)}>
                  <Plus className="size-3.5" />
                  <span className="hidden xl:inline">Margin</span>
                </IconButton>
                <IconButton label={`Close ${pairLabel(item.symbol)}`} disabled={close.pending} onClick={() => close.submit(item.id)}>
                  <X className="size-3.5" />
                  Close
                </IconButton>
              </span>
            ),
          },
        };
      }),
      empty: { title: "No open positions", text: "Open a long or short position to see it here." },
    },
    orders: {
      columns: columns.orders,
      rows: pendingOrders.map((item) => ({
        id: item.id,
        searchText: pairLabel(item.symbol),
        sortValues: { pair: item.symbol },
        cells: {
          pair: (
            <PairLink market={market} item={item}>
              <SideText value={item.side} /> {item.leverage}x limit
            </PairLink>
          ),
          limit: <span className="tabular-nums text-white">{formatPrice(item.limitPrice)}</span>,
          margin: <span className="tabular-nums">{formatUsdt(item.margin)}</span>,
          created: <span className="text-neutral-400">{dateTime.format(new Date(item.createdAt))}</span>,
          actions: (
            <IconButton label={`Cancel ${pairLabel(item.symbol)} order`} disabled={cancel.pending} onClick={() => cancel.submit(item.id)}>
              <X className="size-3.5" />
              Cancel
            </IconButton>
          ),
        },
      })),
      empty: { title: "No open orders", text: "Pending limit orders appear here until they fill." },
    },
  }[tab];

  const counts = { positions: openPositions.length, orders: pendingOrders.length, open: openTimed.length };
  const tabItems = tabs.map((item) => ({ ...item, label: counts[item.value] ? `${item.label} (${counts[item.value]})` : item.label }));

  const emptyState = data && !data.signedIn ? (
    <SignInPrompt title="Log in to see your orders" text="Your positions, open orders and trade history appear here." />
  ) : isPending ? (
    <EmptyState icon={ListChecks} title="Loading orders…" />
  ) : isError ? (
    <EmptyState icon={ListChecks} title="Could not load your orders" text={error?.message ?? "Your positions are safe. Retrying automatically."} />
  ) : (
    <EmptyState icon={ListChecks} title={view.empty.title} text={view.empty.text} />
  );

  return (
    <>
      <DataTable
        tabs={<SegmentedTabs items={tabItems} value={tab} onChange={setTab} variant="pill" label="Your orders" />}
        filters={
          tab === "positions" && openPositions.length > 1 ? (
            <GradientButton variant="dark" size="sm" onClick={() => setConfirmCloseAll(true)}>
              Close All
            </GradientButton>
          ) : null
        }
        searchPlaceholder="Search orders"
        columns={view.columns}
        rows={view.rows}
        initialSort={tab === "history" ? { key: "time", direction: "desc" } : undefined}
        emptyState={emptyState}
        className="h-full"
      />
      <AddMarginDialog position={marginTarget} available={data?.available ?? 0} onClose={() => setMarginTarget(null)} onDone={refresh} />
      <ConfirmDialog
        open={confirmCloseAll}
        onOpenChange={setConfirmCloseAll}
        title="Close all positions"
        description={`${openPositions.length} open positions will be closed at the live market price.`}
        confirmLabel="Close All"
        tone="down"
        pending={closeAll.pending}
        onConfirm={() => closeAll.submit()}
      />
    </>
  );
};
