import { focusRing } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

export const controlClass =
  "h-10 w-full min-w-0 rounded-lg border border-white/10 bg-field px-3 text-sm text-white placeholder:text-neutral-600 focus:border-brand/60 focus:outline-none aria-[invalid=true]:border-down/60 disabled:opacity-50 [color-scheme:dark] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const Field = ({ id, label, hint, error, className, children, aside }) => (
  <div className={cn("flex min-w-0 flex-col gap-2", className)}>
    {(label || aside) && (
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label htmlFor={id} className="text-xs text-neutral-300">
            {label}
          </label>
        )}
        {aside}
      </div>
    )}
    {children}
    {error ? (
      <p role="alert" className="text-xs text-down">
        {error}
      </p>
    ) : (
      hint && <p className="text-xs text-neutral-500">{hint}</p>
    )}
  </div>
);

export const FieldAction = ({ className, children, ...props }) => (
  <button type="button" className={cn("rounded text-xs text-brand transition-colors hover:text-brand-light", focusRing, className)} {...props}>
    {children}
  </button>
);

export const SummaryList = ({ items, className }) => (
  <dl className={cn("grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 rounded-xl border border-white/5 bg-field p-3 text-xs", className)}>
    {items.map((item) => (
      <div key={item.label} className="contents">
        <dt className="text-neutral-500">{item.label}</dt>
        <dd className={cn("text-right text-white tabular-nums", item.className)}>{item.value}</dd>
      </div>
    ))}
  </dl>
);
