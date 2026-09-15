"use client";

import { focusRing } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

export const SegmentedTabs = ({ items, value, onChange, variant = "underline", fill = false, toggle = false, className, label }) => (
  <div
    role={toggle ? "group" : "tablist"}
    aria-label={label}
    className={cn(
      "flex max-w-full overflow-x-auto scrollbar-none",
      variant === "underline" ? "gap-6 border-b border-white/10" : "h-9 gap-1 rounded-lg border border-white/10 bg-field p-0.5",
      variant === "pill" && (fill ? "grid w-full auto-cols-fr grid-flow-col" : "w-fit"),
      className,
    )}
  >
    {items.map((item) => {
      const active = item.value === value;
      return (
        <button
          key={item.value}
          type="button"
          role={toggle ? undefined : "tab"}
          aria-selected={toggle ? undefined : active}
          aria-pressed={toggle ? active : undefined}
          onClick={() => onChange(item.value)}
          className={cn(
            "relative shrink-0 text-sm whitespace-nowrap transition-colors",
            focusRing,
            "focus-visible:-outline-offset-2",
            variant === "underline" ? "h-11" : "rounded-md px-3 font-medium",
            variant === "underline" && (active ? "text-white" : "text-neutral-500 hover:text-neutral-300"),
            variant === "pill" && (active ? (item.activeClassName ?? "bg-white/10 text-white") : "text-neutral-500 hover:text-neutral-300"),
          )}
        >
          {item.label}
          {variant === "underline" && active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
        </button>
      );
    })}
  </div>
);
