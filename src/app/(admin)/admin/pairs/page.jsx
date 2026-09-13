import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { defaultPairs } from "@/lib/market/pairs";
import { formatDuration, perpetualRules, timedDurations } from "@/lib/market/trading-rules";
import { getPairSettings } from "@/lib/pair-settings";
import { requireAdmin } from "@/lib/session";
import { PairsManager } from "@/features/admin/components/pairs-manager";

export const metadata = {
  title: "Pairs",
};

const ruleTile = "rounded-lg border border-white/5 bg-field p-3 text-center";

const PairsPage = async () => {
  await requireAdmin();
  const settings = await getPairSettings();

  return (
    <>
      <PageHeader title="Trading Pairs" description="Pause markets or cap leverage per pair. Prices always come from Binance and cannot be edited." />
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <GlowCard as="section" aria-labelledby="payout-title">
          <CardHeader id="payout-title" title="Timed trade payout table" />
          <CardBody>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {timedDurations.map((item) => (
                <li key={item.seconds} className={ruleTile}>
                  <p className="text-sm text-white">{formatDuration(item.seconds)}</p>
                  <p className="mt-1 text-xs text-up">{Math.round(item.payoutRate * 100)}%</p>
                  <p className="mt-1 text-[11px] text-neutral-500">min {item.minAmount}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="perp-title">
          <CardHeader id="perp-title" title="Perpetual rules" />
          <CardBody>
            <dl className="grid grid-cols-3 gap-2">
              <div className={ruleTile}>
                <dt className="text-[11px] text-neutral-500">Max leverage</dt>
                <dd className="mt-1 text-sm text-white">{perpetualRules.maxLeverage}x</dd>
              </div>
              <div className={ruleTile}>
                <dt className="text-[11px] text-neutral-500">Taker fee</dt>
                <dd className="mt-1 text-sm text-white">{perpetualRules.takerFeeRate * 100}%</dd>
              </div>
              <div className={ruleTile}>
                <dt className="text-[11px] text-neutral-500">Maint. margin</dt>
                <dd className="mt-1 text-sm text-white">{perpetualRules.maintenanceMarginRate * 100}%</dd>
              </div>
            </dl>
          </CardBody>
        </GlowCard>
      </div>
      <PairsManager pairs={defaultPairs} settings={settings} />
    </>
  );
};

export default PairsPage;
