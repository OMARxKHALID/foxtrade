import Link from "next/link";
import { notFound } from "next/navigation";
import { CandlestickChart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeader } from "@/components/ui/page-header";
import { tradingGuides } from "@/lib/content/trading-guide";
import { formatDuration, perpetualRules, timedDurations } from "@/lib/market/trading-rules";
import { cn } from "@/lib/utils";

export const generateStaticParams = () => Object.keys(tradingGuides).map((market) => ({ market }));

export const generateMetadata = async ({ params }) => {
  const { market } = await params;
  return { title: tradingGuides[market]?.title ?? "Trading Rules" };
};

const tableHead = "h-10 px-4 text-left text-xs font-normal text-neutral-500 sm:px-6";
const tableCell = "h-12 px-4 text-sm text-white tabular-nums sm:px-6";

const TimedTable = () => (
  <table className="w-full">
    <thead className="border-b border-white/10">
      <tr>
        <th className={tableHead}>Duration</th>
        <th className={tableHead}>Payout rate</th>
        <th className={cn(tableHead, "text-right")}>Minimum stake</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-white/5">
      {timedDurations.map((rule) => (
        <tr key={rule.seconds}>
          <td className={tableCell}>{formatDuration(rule.seconds)}</td>
          <td className={cn(tableCell, "text-up")}>{Math.round(rule.payoutRate * 100)}%</td>
          <td className={cn(tableCell, "text-right")}>{rule.minAmount} USDT</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const PerpetualTable = () => (
  <table className="w-full">
    <tbody className="divide-y divide-white/5">
      {[
        ["Maximum leverage", `${perpetualRules.maxLeverage}x`],
        ["Margin mode", "Isolated"],
        ["Taker fee", `${perpetualRules.takerFeeRate * 100}%`],
        ["Maintenance margin rate", `${perpetualRules.maintenanceMarginRate * 100}%`],
        ["Settlement asset", "USDT"],
      ].map(([label, value]) => (
        <tr key={label}>
          <td className={cn(tableCell, "text-neutral-400")}>{label}</td>
          <td className={cn(tableCell, "text-right")}>{value}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const RulesPage = async ({ params }) => {
  const { market } = await params;
  const guide = tradingGuides[market];
  if (!guide) notFound();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        title={guide.title}
        description={guide.summary}
        backHref={guide.tradeHref}
        actions={
          <GradientButton href={guide.tradeHref} size="sm">
            <CandlestickChart className="size-4" />
            Start Trading
          </GradientButton>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
        <GlowCard as="nav" aria-label="Trading rules" className="h-fit p-2">
          <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
            {Object.entries(tradingGuides).map(([key, item]) => (
              <li key={key}>
                <Link
                  href={`/trade/rules/${key}`}
                  aria-current={key === market ? "page" : undefined}
                  className={cn("block rounded-lg px-3 py-2 text-sm whitespace-nowrap", key === market ? "bg-white/5 text-brand" : "text-neutral-300")}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </GlowCard>
        <div className="flex flex-col gap-4 lg:gap-6">
          <GlowCard as="section" aria-labelledby="rules-table-title" className="overflow-hidden">
            <CardHeader id="rules-table-title" title={market === "timed" ? "Durations and payouts" : "Contract specifications"} />
            <div className="overflow-x-auto">{market === "timed" ? <TimedTable /> : <PerpetualTable />}</div>
          </GlowCard>
          {guide.sections.map((section, i) => (
            <GlowCard key={section.heading} as="section" aria-labelledby={`rules-section-${i}`}>
              <CardHeader id={`rules-section-${i}`} title={section.heading} />
              <CardBody>
                <ul className="flex flex-col gap-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-neutral-300">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </GlowCard>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default RulesPage;
