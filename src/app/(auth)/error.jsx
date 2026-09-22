"use client";

import { TriangleAlert } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";

const AuthError = ({ reset }) => (
  <GlowCard className="flex flex-col items-center gap-4 px-6 py-14 text-center">
    <TriangleAlert className="size-8 text-brand" strokeWidth={1.5} />
    <h1 className="font-heading text-xl font-bold tracking-tight text-white">We couldn&apos;t load this page</h1>
    <p className="max-w-sm text-sm text-neutral-400">Your account is safe and nothing was submitted. Try again in a moment.</p>
    <GradientButton onClick={reset} size="sm">
      Try Again
    </GradientButton>
  </GlowCard>
);

export default AuthError;
