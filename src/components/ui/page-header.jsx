import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const PageHeader = ({ title, description, backHref, actions, className }) => (
  <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
    <div className="min-w-0">
      {backHref && (
        <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-xs text-neutral-400">
          <ChevronLeft className="size-3.5" />
          Back
        </Link>
      )}
      <h1 className="font-heading text-2xl font-bold tracking-tight wrap-anywhere text-white md:text-[32px]">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-neutral-400">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </header>
);
