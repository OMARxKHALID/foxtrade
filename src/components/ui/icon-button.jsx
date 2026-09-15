import { cn } from "@/lib/utils";

export const IconButton = ({ label, className, children, type = "button", ...props }) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={cn(
      "inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 text-xs text-neutral-300 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </button>
);
