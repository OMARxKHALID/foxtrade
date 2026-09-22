"use client";

import { TriangleAlert } from "lucide-react";
import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";

const TradeError = ({ reset }) => (
  <Container>
    <GlowCard className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <TriangleAlert className="size-8 text-brand" strokeWidth={1.5} />
      <h1 className="font-heading text-2xl font-bold tracking-tight text-white">This market didn&apos;t load</h1>
      <p className="max-w-sm text-sm leading-6 text-neutral-400">
        Live prices may be temporarily unavailable. Your open trades are safe and keep settling on our servers.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <GradientButton onClick={reset} size="sm">
          Try Again
        </GradientButton>
        <GradientButton href="/markets" variant="dark" size="sm">
          Back to Markets
        </GradientButton>
      </div>
    </GlowCard>
  </Container>
);

export default TradeError;
