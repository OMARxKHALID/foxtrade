import { cn } from "@/lib/utils";

export const PageLoader = ({ className, label = "Loading" }) => (
  <div role="status" aria-live="polite" className={cn("flex min-h-[60vh] w-full items-center justify-center", className)}>
    <span className="size-9 animate-spin rounded-full border-[3px] border-white/10 border-t-brand" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
);
