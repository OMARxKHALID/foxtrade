import Link from "next/link";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, LayoutGrid } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { IconTile } from "@/components/ui/icon-tile";
import { quickActions } from "@/features/home/data/home-content";

const icons = { withdraw: ArrowUpFromLine, deposit: ArrowDownToLine, convert: ArrowLeftRight, more: LayoutGrid };

export const QuickActions = () => (
  <nav aria-label="Quick actions">
    <ul className="grid h-full grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
      {quickActions.map((action) => (
        <li key={action.label}>
          <GlowCard className="h-full">
            <Link
              href={action.href}
              className="flex h-full flex-col items-center justify-center gap-2.5 py-4 text-xs text-white sm:gap-3 sm:text-sm"
            >
              <IconTile icon={icons[action.icon]} size="md" />
              {action.label}
            </Link>
          </GlowCard>
        </li>
      ))}
    </ul>
  </nav>
);
