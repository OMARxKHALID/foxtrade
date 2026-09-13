import { Compass } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

export const metadata = {
  title: "Page not found",
};

const NotFound = () => (
  <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
    <span className="flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
      <Compass className="size-6 text-brand" strokeWidth={1.5} />
    </span>
    <p className="font-heading text-6xl font-bold tracking-tight text-white">404</p>
    <p className="max-w-sm text-sm text-neutral-400">This page doesn&apos;t exist or has moved.</p>
    <div className="flex gap-3">
      <GradientButton href="/" size="sm">
        Go Home
      </GradientButton>
      <GradientButton href="/markets" variant="dark" size="sm">
        View Markets
      </GradientButton>
    </div>
  </main>
);

export default NotFound;
