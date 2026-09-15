import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { formatPrice, formatQuantity, formatUsdt } from "@/lib/format";
import { SideText, SignedAmount, Status, closeReasons, dateTime, pairLabel, positionStatus, timedStatus } from "@/features/trading/components/trade-format";

const when = (value) => (value ? dateTime.format(new Date(value)) : "--");
const price = (value) => (value ? formatPrice(value) : "--");

const groupsFor = (market, order) =>
  market === "timed"
    ? [
        {
          title: "Trade",
          rows: [
            ["Pair", pairLabel(order.symbol)],
            ["Direction", <SideText key="d" value={order.direction} />],
            ["Duration", `${order.duration}s`],
            ["Stake", `${formatUsdt(order.amount)} USDT`],
            ["Payout rate", `${Math.round(order.payoutRate * 100)}%`],
          ],
        },
        {
          title: "Prices",
          rows: [
            ["Open price", price(order.openPrice)],
            ["Close price", price(order.closePrice)],
            ["Opened at", when(order.openedAt)],
            ["Expires at", when(order.expiresAt)],
          ],
        },
        {
          title: "Result",
          rows: [
            ["Outcome", <Status key="s" map={timedStatus} value={order.status} />],
            ["Payout", order.payout === null ? "--" : `${formatUsdt(order.payout)} USDT`],
            ["Profit", ["open", "cancelled"].includes(order.status) ? "--" : <SignedAmount key="p" value={(order.payout ?? 0) - order.amount} />],
          ],
        },
      ]
    : [
        {
          title: "Position",
          rows: [
            ["Pair", pairLabel(order.symbol)],
            ["Side", <SideText key="s" value={order.side} />],
            ["Type", order.type === "limit" ? "Limit" : "Market"],
            ["Leverage", `${order.leverage}x`],
            ["Size", formatQuantity(order.size)],
            ["Margin", `${formatUsdt(order.margin)} USDT`],
          ],
        },
        {
          title: "Prices",
          rows: [
            ["Entry price", price(order.entryPrice)],
            ["Exit price", price(order.exitPrice)],
            ["Liquidation price", price(order.liquidationPrice)],
            ["Take profit", price(order.takeProfit)],
            ["Stop loss", price(order.stopLoss)],
          ],
        },
        {
          title: "Result",
          rows: [
            ["Status", <Status key="st" map={positionStatus} value={order.status} />],
            ["Closed by", closeReasons[order.closeReason] ?? "--"],
            ["Realised PnL", order.pnl === null ? "--" : <SignedAmount key="pnl" value={order.pnl} />],
            ["Fees", `${formatUsdt((order.openFee ?? 0) + (order.closeFee ?? 0))} USDT`],
            ["Opened at", when(order.openedAt)],
            ["Closed at", when(order.closedAt)],
          ],
        },
      ];

export const OrderDetail = ({ market, order, signedIn }) => {
  if (!signedIn) {
    return (
      <GlowCard>
        <SignInPrompt title="Log in to view this order" text="Order details load from your account once you are logged in." />
      </GlowCard>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      {groupsFor(market, order).map((group) => (
        <GlowCard key={group.title} as="section" aria-labelledby={`detail-${group.title}`}>
          <CardHeader id={`detail-${group.title}`} title={group.title} />
          <CardBody>
            <dl className="flex flex-col gap-3">
              {group.rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className="text-right text-white tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </GlowCard>
      ))}
    </div>
  );
};
