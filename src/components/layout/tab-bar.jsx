"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CandlestickChart, House, Timer, TrendingUp, Wallet } from "lucide-react";
import { appNavLinks } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils";

const icons = { home: House, markets: TrendingUp, futures: Timer, option: CandlestickChart, assets: Wallet };

export const TabBar = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {appNavLinks.map((link) => {
          const Icon = icons[link.icon];
          const active = link.match(pathname);
          return (
            <li key={link.label}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                  active ? "text-brand" : "text-neutral-500",
                )}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />}
                <Icon className="size-5" strokeWidth={active ? 2 : 1.5} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
