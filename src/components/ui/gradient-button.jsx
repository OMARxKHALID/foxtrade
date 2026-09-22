import Link from "next/link";
import { cn } from "@/lib/utils";

export const focusRing = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const hitArea = "relative after:absolute after:-inset-1.5";

const variants = {
  orange: "border border-brand-light/30 bg-gradient-to-b from-brand to-brand-dark text-white hover:opacity-90",
  dark: "border border-white/15 bg-cell text-white hover:opacity-90",
  light: "bg-white text-neutral-900 hover:opacity-90",
  ghost: "text-white hover:bg-white/5",
  outline: "border border-brand/40 text-brand hover:bg-brand/10",
  up: "bg-up text-black hover:opacity-90",
  down: "bg-down text-white hover:opacity-90",
};

const sizes = {
  xs: "h-8 gap-1.5 px-3 text-xs",
  sm: "h-9 gap-2 px-4 text-sm",
  md: "h-10 gap-2.5 px-5 text-sm",
  lg: "h-12 gap-2.5 px-6 text-sm",
};

const buttonClass = ({ variant = "orange", size = "md", className } = {}) =>
  cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition active:scale-[0.98] active:opacity-75 disabled:pointer-events-none disabled:opacity-50",
    focusRing,
    variants[variant],
    sizes[size],
    className,
  );

export const GradientButton = ({ href, variant, size, className, children, type = "button", ...props }) => {
  const classes = buttonClass({ variant, size, className });
  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
};
