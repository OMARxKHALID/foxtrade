import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-white/10 text-neutral-300",
  success: "bg-up/12 text-up",
  danger: "bg-down/12 text-down",
  warning: "bg-amber-500/12 text-amber-400",
  brand: "bg-brand/12 text-brand",
};

export const StatusBadge = ({ tone = "neutral", className, children }) => (
  <span className={cn("inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium", tones[tone], className)}>
    {children}
  </span>
);
