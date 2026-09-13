import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  orange: "border border-orange-400/30 bg-gradient-to-b from-[#f25a1d] to-brand-dark text-white",
  white: "bg-white text-neutral-900",
  dark: "border border-white/15 bg-cell text-white",
  up: "bg-up text-black",
  down: "bg-down text-white",
};

const sizes = {
  xs: "h-8 gap-1.5 px-3 text-xs",
  sm: "h-9 gap-2 px-4 text-sm",
  md: "h-11 gap-2.5 px-5 text-sm",
  lg: "h-12 gap-2.5 px-6 text-sm",
};

const buttonClass = ({ variant = "orange", size = "md", className } = {}) =>
  cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
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
