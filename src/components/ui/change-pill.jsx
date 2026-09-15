import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const ChangePill = ({ value, size = "md", className }) => {
  const up = value > 0;
  const flat = !value;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-0.5 rounded-md font-medium whitespace-nowrap tabular-nums",
        size === "md" ? "h-8 min-w-[84px] px-2 text-xs" : "h-6 px-1.5 text-2xs",
        flat && "bg-white/10 text-neutral-300",
        up && "bg-up/12 text-up",
        !up && !flat && "bg-down/12 text-down",
        className,
      )}
    >
      {!flat && (up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />)}
      {formatPercent(value)}
    </span>
  );
};
