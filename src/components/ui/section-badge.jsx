import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const SectionBadge = ({ children, muted, className }) => (
  <div
    className={cn(
      "inline-flex h-7 items-center gap-2.5 rounded-full border border-white/15 bg-cell pr-1 pl-3 text-[11px] text-white",
      className,
    )}
  >
    <span>
      {children}
      {muted && <span className="text-neutral-500"> {muted}</span>}
    </span>
    <span className="flex h-5 w-7 items-center justify-center rounded-full bg-white text-neutral-900">
      <ArrowRight className="size-3" strokeWidth={2.5} />
    </span>
  </div>
);
