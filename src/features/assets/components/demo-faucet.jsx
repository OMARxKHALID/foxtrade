"use client";

import { Gift, ShieldAlert } from "lucide-react";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { IconTile } from "@/components/ui/icon-tile";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatUsdt } from "@/lib/format";
import { claimDemoAssets } from "@/features/assets/actions/assets-actions";
import { usePlatform } from "@/hooks/use-platform";

const rules = [
  "Demo assets are credited to your Spot Wallet in USDT.",
  "You can top up once every 24 hours while your total USDT across all wallets is below the demo amount.",
  "Demo funds have no monetary value and cannot be withdrawn.",
];

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const DemoFaucet = ({ status }) => {
  const { demoAmount } = usePlatform().settings;
  const { pending, submit } = useActionSubmit({ action: claimDemoAssets, successMessage: "Demo assets added to your Spot Wallet." });

  const handleClaim = () => submit();
  const full = Boolean(status) && status.usdtTotal >= demoAmount;
  const coolingDown = Boolean(status?.nextClaimAt);
  const blockedReason = full ? "Your USDT (including funds in open trades) already reaches the demo amount." : coolingDown ? `Next claim available ${dateFormat.format(new Date(status.nextClaimAt))}.` : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
      <GlowCard variant="warm">
        <CardBody>
          <IconTile icon={Gift} size="lg" />
          <h2 className="mt-6 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">Top up to {formatUsdt(demoAmount)} USDT</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-400">
            Refill your demo Spot Wallet and keep practicing timed trades and leveraged positions with live market prices.
          </p>
          {status && <p className="mt-4 text-sm text-neutral-300">USDT across wallets and open trades: <span className="text-white tabular-nums">{formatUsdt(status.usdtTotal)}</span></p>}
          <GradientButton onClick={handleClaim} disabled={pending || Boolean(blockedReason)} className="mt-6">
            {pending ? "Claiming…" : "Claim Demo Assets"}
          </GradientButton>
          {blockedReason && <p className="mt-3 text-xs text-neutral-500">{blockedReason}</p>}
        </CardBody>
      </GlowCard>
      <GlowCard as="section" aria-labelledby="faucet-rules">
        <CardHeader
          id="faucet-rules"
          title={
            <span className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-brand" />
              How demo deposits work
            </span>
          }
        />
        <CardBody>
          <ol className="flex flex-col gap-4">
            {rules.map((rule, i) => (
              <li key={rule} className="flex gap-3 text-sm leading-6 text-neutral-400">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-neutral-400">{i + 1}</span>
                {rule}
              </li>
            ))}
          </ol>
        </CardBody>
      </GlowCard>
    </div>
  );
};
