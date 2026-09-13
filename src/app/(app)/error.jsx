"use client";

import { TriangleAlert } from "lucide-react";
import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";

const AppError = ({ reset }) => (
  <Container>
    <GlowCard className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <TriangleAlert className="size-8 text-brand" strokeWidth={1.5} />
      <h1 className="font-heading text-xl font-semibold text-white">Something went wrong</h1>
      <p className="max-w-sm text-sm text-neutral-400">We couldn&apos;t load this page. Market data may be temporarily unavailable.</p>
      <GradientButton onClick={reset} size="sm">
        Try Again
      </GradientButton>
    </GlowCard>
  </Container>
);

export default AppError;
