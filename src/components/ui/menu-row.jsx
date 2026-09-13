import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const MenuRow = ({ href, icon: Icon, label, description, value, className }) => (
  <Link
    href={href}
    className={cn("flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.03]", className)}
  >
    {Icon && (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <Icon className="size-4 text-brand" strokeWidth={1.75} />
      </span>
    )}
    <span className="min-w-0 flex-1">
      <span className="block text-sm text-white">{label}</span>
      {description && <span className="mt-0.5 block truncate text-xs text-neutral-500">{description}</span>}
    </span>
    {value && <span className="text-xs text-neutral-400">{value}</span>}
    <ChevronRight className="size-4 shrink-0 text-neutral-500" />
  </Link>
);
