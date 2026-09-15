"use client";

import { Gift, ShieldAlert } from "lucide-react";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { IconTile } from "@/components/ui/icon-tile";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { formatUsdt } from "@/lib/format";
import { claimDemoAssets } from "@/features/assets/actions/assets-actions";
import { DEMO_FAUCET_AMOUNT } from "@/features/assets/data/assets-config";

const rules = [
  "Demo assets are credited to your Spot Wallet in USDT.",
  "You can top up once every 24 hours while your total USDT across all wallets is below the demo amount.",
  "Demo funds have no monetary value and cannot be withdrawn.",
];

export const DemoFaucet = ({ usdtTotal }) => {
  const { pending, submit } = useActionSubmit({ action: claimDemoAssets, successMessage: "Demo assets added to your Spot Wallet." });

  const handleClaim = () => submit();

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6">
      <GlowCard variant="warm">
        <CardBody>
          <IconTile icon={Gift} size="lg" />
          <h2 className="mt-6 font-heading text-2xl font-bold text-white sm:text-3xl">Top up to {formatUsdt(DEMO_FAUCET_AMOUNT)} USDT</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-400">
            Refill your demo Spot Wallet and keep practicing timed trades and leveraged positions with live market prices.
          </p>
          {usdtTotal !== null && <p className="mt-4 text-sm text-neutral-300">USDT across wallets: <span className="text-white tabular-nums">{formatUsdt(usdtTotal)}</span></p>}
          <GradientButton onClick={handleClaim} disabled={pending} className="mt-6">
            {pending ? "Claiming…" : "Claim Demo Assets"}
          </GradientButton>
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
