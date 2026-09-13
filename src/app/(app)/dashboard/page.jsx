import Link from "next/link";
import { ArrowDownToLine, ArrowRightLeft, CandlestickChart, CircleCheck, CircleDashed, ReceiptText, Timer } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { walletLabels } from "@/lib/demo";
import { formatPrice } from "@/lib/format";
import { collections } from "@/lib/mongo";
import { hasPin } from "@/lib/pin";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { toRecordRow } from "@/features/assets/components/record-rows";
import { getAssetsOverview, listRecords } from "@/features/assets/dal/assets-dal";
import { OpenActivity } from "@/features/trading/components/open-activity";
import { getTradingSummary } from "@/features/trading/dal/trading-engine";

export const metadata = {
  title: "Dashboard",
};

export const instant = false;

const actions = [
  { label: "Deposit", href: "/assets/deposit", icon: ArrowDownToLine },
  { label: "Transfer", href: "/assets/transfer", icon: ArrowRightLeft },
  { label: "Futures", href: "/trade/timed/btcusdt", icon: Timer },
  { label: "Option", href: "/trade/perpetual/btcusdt", icon: CandlestickChart },
  { label: "Records", href: "/assets/records", icon: ReceiptText },
];

const Stat = ({ label, value, hint, tone }) => (
  <GlowCard className="h-full p-4 sm:p-5">
    <p className="text-xs text-neutral-500">{label}</p>
    <p className={cn("mt-2 font-heading text-xl font-bold tabular-nums sm:text-2xl", tone ?? "text-white")}>{value}</p>
    {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
  </GlowCard>
);

const DashboardPage = async () => {
  const user = await requireUser("/dashboard");
  const [overview, summary, records, verification, pinSet] = await Promise.all([
    getAssetsOverview(user.id),
    getTradingSummary(user.id),
    listRecords(user.id, { limit: 6 }),
    collections.verifications().findOne({ userId: user.id }, { projection: { status: 1 } }),
    hasPin(user.id),
  ]);

  const settledTimed = summary.recentTimed.filter((item) => item.status !== "draw");
  const wins = settledTimed.filter((item) => item.status === "won").length;
  const winRate = settledTimed.length ? Math.round((wins / settledTimed.length) * 100) : null;
  const timedProfit = summary.recentTimed.reduce((sum, item) => sum + (item.payout ?? 0) - item.amount, 0);
  const positionProfit = summary.recentPositions.reduce((sum, item) => sum + (item.pnl ?? 0), 0);
  const realised = timedProfit + positionProfit;
  const checklist = [
    { label: "Identity verified", done: verification?.status === "approved", href: "/account/verification", pending: verification?.status === "pending" },
    { label: "Withdrawal PIN set", done: pinSet, href: "/account/security#withdrawal-pin" },
    { label: "Funds in a trading wallet", done: (overview.walletTotals.timed ?? 0) + (overview.walletTotals.perpetual ?? 0) > 0, href: "/assets/transfer" },
  ];

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Dashboard" description={`Welcome back, ${user.email}.`} />

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <GlowCard variant="warm">
          <CardBody>
            <p className="text-sm text-neutral-400">Total Assets (USDT)</p>
            <p className="mt-3 font-heading text-4xl font-bold tracking-tight text-white tabular-nums sm:text-5xl">{formatPrice(overview.totalUsdt)}</p>
            <ul className="mt-5 grid grid-cols-3 gap-3 text-xs">
              {Object.entries(walletLabels).map(([wallet, label]) => (
                <li key={wallet} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="block truncate text-neutral-500">{label}</span>
                  <span className="mt-0.5 block text-sm text-white tabular-nums">{formatPrice(overview.walletTotals[wallet] ?? 0)}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-6 grid grid-cols-5 gap-2 sm:gap-4">
              {actions.map((action) => (
                <li key={action.label}>
                  <Link href={action.href} className="flex flex-col items-center gap-2 text-center text-xs text-white">
                    <IconTile icon={action.icon} size="md" />
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="checklist-title">
          <CardHeader id="checklist-title" title="Account checklist" />
          <CardBody>
            <ul className="flex flex-col gap-3">
              {checklist.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-field px-4 py-3">
                    <span className="flex items-center gap-3 text-sm text-white">
                      {item.done ? <CircleCheck className="size-4 text-up" /> : <CircleDashed className="size-4 text-neutral-500" />}
                      {item.label}
                    </span>
                    <span className={cn("text-xs", item.done ? "text-up" : "text-brand")}>{item.done ? "Done" : item.pending ? "Under review" : "Set up"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </GlowCard>
      </div>

      <ul className="grid grid-cols-2 gap-4 lg:gap-6 xl:grid-cols-4">
        <li>
          <Stat label="Realised PnL (recent)" value={`${realised > 0 ? "+" : ""}${formatPrice(realised)}`} hint="Last 50 closed trades" tone={realised > 0 ? "text-up" : realised < 0 ? "text-down" : undefined} />
        </li>
        <li>
          <Stat label="Timed win rate" value={winRate === null ? "--" : `${winRate}%`} hint={settledTimed.length ? `${wins} of ${settledTimed.length} settled` : "No settled trades yet"} />
        </li>
        <li>
          <Stat label="Open positions" value={summary.openPositions.length} hint="Perpetual, incl. pending" />
        </li>
        <li>
          <Stat label="Open timed trades" value={summary.openTimed.length} hint="Waiting to settle" />
        </li>
      </ul>

      <OpenActivity positions={summary.openPositions} timed={summary.openTimed} />

      <GlowCard as="section" aria-labelledby="recent-activity-title" className="overflow-hidden">
        <CardHeader id="recent-activity-title" title="Recent activity" actions={<Link href="/assets/records" className="text-xs text-brand">All records</Link>} />
        {records.length ? (
          <ul className="divide-y divide-white/5">
            {records.map((record) => {
              const row = toRecordRow(record);
              return (
                <li key={record.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-6">
                  <span className="min-w-0">
                    {row.cells.type}
                    <span className="block text-xs text-neutral-500">{row.cells.time}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    {row.cells.amount}
                    <span className="block text-xs text-neutral-500">{record.asset}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <CardBody>
            <p className="text-sm text-neutral-500">No activity yet.</p>
          </CardBody>
        )}
      </GlowCard>
    </Container>
  );
};

export default DashboardPage;
