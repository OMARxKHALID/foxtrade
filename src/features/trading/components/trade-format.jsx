import { StatusBadge } from "@/components/ui/status-badge";
import { formatUsdt } from "@/lib/format";
import { pairLabel } from "@/lib/market/pairs";
import { cn } from "@/lib/utils";

export { pairLabel };

export const dateTime = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const timedStatus = {
  open: { tone: "brand", label: "Open" },
  won: { tone: "success", label: "Won" },
  lost: { tone: "danger", label: "Lost" },
  draw: { tone: "neutral", label: "Draw" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

export const positionStatus = {
  pending: { tone: "warning", label: "Pending" },
  open: { tone: "brand", label: "Open" },
  closed: { tone: "neutral", label: "Closed" },
  liquidated: { tone: "danger", label: "Liquidated" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

export const closeReasons = {
  manual: "Closed manually",
  take_profit: "Take profit",
  stop_loss: "Stop loss",
  liquidation: "Liquidated",
  admin_reset: "Balance reset",
};

export const Status = ({ map, value }) => <StatusBadge tone={map[value]?.tone ?? "neutral"}>{map[value]?.label ?? value}</StatusBadge>;

export const unrealizedPnl = (position, markPrice, feeRate) => {
  const price = markPrice || position.entryPrice;
  const gross = (position.side === "long" ? price - position.entryPrice : position.entryPrice - price) * position.size;
  return gross - price * position.size * (position.takerFeeRate ?? feeRate);
};

export const SignedAmount = ({ value, suffix = "USDT", className }) => {
  if (value === null || value === undefined) return <span className="text-neutral-500">--</span>;
  return (
    <span className={cn("tabular-nums", value > 0 ? "text-up" : value < 0 ? "text-down" : "text-neutral-300", className)}>
      {value > 0 ? "+" : ""}
      {formatUsdt(value)} {suffix}
    </span>
  );
};

export const directionLabels = { call: "Buy High", put: "Buy Low", long: "Long", short: "Short" };

export const SideText = ({ value }) => (
  <span className={cn("font-medium", ["long", "call"].includes(value) ? "text-up" : "text-down")}>{directionLabels[value] ?? value}</span>
);
