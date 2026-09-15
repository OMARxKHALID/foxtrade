import { ChartColumn, ShieldCheck, Trophy, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { CardBody, GlowCard } from "@/components/ui/glow-card";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { formatUsdt } from "@/lib/format";
import { getLeaderboard } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Copy Trading",
};

const steps = [
  { icon: ChartColumn, title: "Verified track records", text: "Only identity-verified traders are ranked, using settled trades from the last 30 days." },
  { icon: Users, title: "Privacy first", text: "Traders are shown with masked emails. Only settled results are counted." },
  { icon: ShieldCheck, title: "No one trades for you", text: "Nobody can place orders on your account. Use the rankings to learn from consistent traders." },
];

const columns = [
  { key: "rank", header: "Rank", sortable: true },
  { key: "trader", header: "Trader" },
  { key: "roi", header: "30d ROI", align: "right", sortable: true },
  { key: "winRate", header: "Win rate", align: "right", sortable: true, hideBelow: "sm" },
  { key: "pnl", header: "30d PnL", align: "right", sortable: true, hideBelow: "md" },
  { key: "trades", header: "Settled trades", align: "right", sortable: true, hideBelow: "md" },
];

const CopyTradingPage = async () => {
  const leaders = await getLeaderboard();
  const rows = leaders.map((row) => ({
    id: String(row.rank),
    searchText: row.trader,
    sortValues: row,
    cells: {
      rank: <span className={cn("font-heading font-semibold tabular-nums", row.rank <= 3 ? "text-brand" : "text-neutral-400")}>#{row.rank}</span>,
      trader: <span className="text-white">{row.trader}</span>,
      roi: <span className={cn("tabular-nums", row.roi >= 0 ? "text-up" : "text-down")}>{row.roi >= 0 ? "+" : ""}{row.roi.toFixed(2)}%</span>,
      winRate: <span className="tabular-nums">{row.winRate}%</span>,
      pnl: <span className={cn("tabular-nums", row.pnl >= 0 ? "text-up" : "text-down")}>{formatUsdt(row.pnl)}</span>,
      trades: <span className="tabular-nums text-neutral-300">{row.trades}</span>,
    },
  }));

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Copy Trading" description="Discover consistent traders ranked by their real settled results." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        {steps.map((step) => (
          <GlowCard key={step.title}>
            <CardBody>
              <IconTile icon={step.icon} />
              <h2 className="mt-4 font-heading text-base font-semibold text-white">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{step.text}</p>
            </CardBody>
          </GlowCard>
        ))}
      </div>
      <DataTable
        title="Leaderboard"
        titleId="leaderboard-title"
        searchPlaceholder="Search traders"
        columns={columns}
        rows={rows}
        initialSort={{ key: "rank", direction: "asc" }}
        emptyState={<EmptyState icon={Trophy} title="No ranked traders yet" text="Verified traders appear here after at least 5 settled trades in the last 30 days." />}
      />
    </Container>
  );
};

export default CopyTradingPage;
