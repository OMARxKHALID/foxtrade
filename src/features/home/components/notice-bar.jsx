import Link from "next/link";
import { ChevronRight, Megaphone } from "lucide-react";
import { Marquee } from "@/components/motion/marquee";
import { focusRing } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";

export const NoticeBar = ({ notices }) => {
  if (!notices.length) return null;

  return (
    <Link href="/notices" className={cn("flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-panel px-4 transition-colors hover:bg-cell", focusRing)}>
      <Megaphone className="size-4 shrink-0 text-brand" />
      <Marquee fade duration={30} className="min-w-0 flex-1">
        {notices.map((notice) => (
          <span key={notice.id} className="mr-16 shrink-0 text-sm text-neutral-300">
            {notice.summary}
          </span>
        ))}
      </Marquee>
      <ChevronRight className="size-4 shrink-0 text-neutral-400" />
    </Link>
  );
};
