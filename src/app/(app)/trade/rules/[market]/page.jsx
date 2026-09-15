import Link from "next/link";
import { notFound } from "next/navigation";
import { CandlestickChart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeader } from "@/components/ui/page-header";
import { getContent, getPlatformSettings } from "@/lib/cached-settings";
import { bodyLines, contentByKey, documentsInGroup, fillPlaceholders } from "@/lib/content/content-registry";
import { formatDuration } from "@/lib/market/trading-rules";
import { cn } from "@/lib/utils";

const guideDocuments = documentsInGroup("Trading rules");

export const generateStaticParams = () => guideDocuments.map((doc) => ({ market: doc.slug }));

export const generateMetadata = async ({ params }) => {
  const { market } = await params;
  return { title: contentByKey[`guide-${market}`] ? (await getContent(`guide-${market}`)).title : "Trading Rules" };
};

export const instant = false;

const tableHead = "h-10 px-4 text-left text-xs font-normal text-neutral-500 sm:px-6";
const tableCell = "h-12 px-4 text-sm text-white tabular-nums sm:px-6";

const TimedTable = ({ timedDurations }) => (
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

const PerpetualTable = ({ maxLeverage, takerFeeRate, maintenanceMarginRate }) => (
  <table className="w-full">
    <tbody className="divide-y divide-white/5">
      {[
        ["Maximum leverage", `${maxLeverage}x`],
        ["Margin mode", "Isolated"],
        ["Taker fee", `${+(takerFeeRate * 100).toFixed(4)}%`],
        ["Maintenance margin rate", `${+(maintenanceMarginRate * 100).toFixed(4)}%`],
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
  const doc = contentByKey[`guide-${market}`];
  if (!doc) notFound();
  const [settings, content] = await Promise.all([getPlatformSettings(), getContent(doc.key)]);
  const guide = { ...doc.meta, title: content.title, summary: fillPlaceholders(content.summary, settings) };
  const sections = content.sections.map((section) => ({ heading: fillPlaceholders(section.heading, settings), items: bodyLines(fillPlaceholders(section.body, settings)) }));

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
            {guideDocuments.map((item) => (
              <li key={item.key}>
                <Link
                  href={`/trade/rules/${item.slug}`}
                  aria-current={item.slug === market ? "page" : undefined}
                  className={cn("block rounded-lg px-3 py-2 text-sm whitespace-nowrap", item.slug === market ? "bg-white/5 text-brand" : "text-neutral-300")}
                >
                  {item.meta.label}
                </Link>
              </li>
            ))}
          </ul>
        </GlowCard>
        <div className="flex flex-col gap-4 lg:gap-6">
          <GlowCard as="section" aria-labelledby="rules-table-title" className="overflow-hidden">
            <CardHeader id="rules-table-title" title={market === "timed" ? "Durations and payouts" : "Contract specifications"} />
            <div className="overflow-x-auto">{market === "timed" ? <TimedTable timedDurations={settings.timedDurations} /> : <PerpetualTable {...settings} />}</div>
          </GlowCard>
          {sections.map((section, i) => (
            <GlowCard key={`${i}-${section.heading}`} as="section" aria-labelledby={`rules-section-${i}`}>
              <CardHeader id={`rules-section-${i}`} title={section.heading} />
              <CardBody>
                <ul className="flex flex-col gap-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={`${itemIndex}-${item}`} className="flex gap-3 text-sm leading-6 text-neutral-300">
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
