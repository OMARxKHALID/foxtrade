"use client";

import { TriangleAlert } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";

const AdminError = ({ reset }) => (
  <GlowCard className="flex flex-col items-center gap-4 px-6 py-16 text-center">
    <TriangleAlert className="size-8 text-brand" strokeWidth={1.5} />
    <h1 className="font-heading text-2xl font-bold tracking-tight text-white">This admin page didn&apos;t load</h1>
    <p className="max-w-sm text-sm text-neutral-400">Nothing was changed. Try again, and check the server logs if it keeps happening.</p>
    <GradientButton onClick={reset} size="sm">
      Try Again
    </GradientButton>
  </GlowCard>
);

export default AdminError;
