"use client";

import { cn } from "@/lib/utils";

export const SegmentedTabs = ({ items, value, onChange, variant = "underline", className, label }) => (
  <div
    role="tablist"
    aria-label={label}
    className={cn(
      "flex max-w-full overflow-x-auto scrollbar-none",
      variant === "underline" ? "gap-6 border-b border-white/10" : "h-9 w-fit gap-1 rounded-lg border border-white/10 bg-field p-0.5",
      className,
    )}
  >
    {items.map((item) => {
      const active = item.value === value;
      return (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.value)}
          className={cn(
            "relative shrink-0 text-sm whitespace-nowrap transition-colors",
            variant === "underline" ? "h-11" : "rounded-md px-3",
            variant === "underline" && (active ? "text-white" : "text-neutral-500"),
            variant === "pill" && (active ? "bg-white/10 text-white" : "text-neutral-500"),
          )}
        >
          {item.label}
          {variant === "underline" && active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
        </button>
      );
    })}
  </div>
);
