import { cn } from "@/lib/utils";

const variants = {
  plain: "border border-white/10 bg-gradient-to-b from-panel to-surface",
  warm: "border border-white/10 bg-[radial-gradient(120%_70%_at_50%_0%,#2e1609_0%,#140b06_45%,#0d0d0d_100%)]",
};

export const GlowCard = ({ as: Tag = "div", variant = "plain", className, children, ...props }) => (
  <Tag className={cn("relative rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]", variants[variant], className)} {...props}>
    {children}
  </Tag>
);

export const CardHeader = ({ title, description, actions, id, size = "md", as: Tag = "h2", className }) => (
  <div
    className={cn(
      "flex flex-col gap-3 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between",
      size === "md" ? "px-4 py-4 sm:px-6" : "px-4 py-3",
      className,
    )}
  >
    <div className="min-w-0">
      <Tag id={id} className={cn("text-white", size === "md" ? "font-heading text-base font-semibold" : "text-sm font-medium")}>
        {title}
      </Tag>
      {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
    </div>
    {actions && <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
  </div>
);

export const CardBody = ({ className, children }) => <div className={cn("p-4 sm:p-6", className)}>{children}</div>;
