import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";

export const QuickTradeBanner = () => (
  <GlowCard variant="warm" className="h-full overflow-hidden">
    <Link href="/trade/timed/btcusdt" className="relative flex h-full min-h-[96px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <span className="relative">
        <span className="block font-heading text-lg font-bold text-white sm:text-xl">Quick Transaction</span>
        <span className="mt-1 block text-sm text-neutral-300">Safe and convenient</span>
      </span>
      <span className="relative flex size-12 items-center justify-center rounded-full border border-brand-light/30 bg-gradient-to-b from-brand to-brand-dark">
        <ArrowRight className="size-5 text-white" />
      </span>
    </Link>
  </GlowCard>
);
