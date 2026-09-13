import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRightLeft,
  ArrowUpFromLine,
  Bell,
  BookOpen,
  CandlestickChart,
  CircleQuestionMark,
  Copy,
  Download,
  Headset,
  Info,
  Languages,
  ReceiptText,
  ShieldCheck,
  Timer,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { IconTile } from "@/components/ui/icon-tile";
import { moreGroups } from "@/features/home/data/home-content";

const icons = {
  deposit: ArrowDownToLine,
  withdraw: ArrowUpFromLine,
  convert: ArrowLeftRight,
  transfer: ArrowRightLeft,
  records: ReceiptText,
  option: CandlestickChart,
  futures: Timer,
  markets: TrendingUp,
  copy: Copy,
  help: CircleQuestionMark,
  support: Headset,
  notices: Bell,
  share: UserPlus,
  security: ShieldCheck,
  language: Languages,
  download: Download,
  about: Info,
  rules: BookOpen,
};

export const MoreGrid = () => (
  <div className="flex flex-col gap-4 lg:gap-6">
    {moreGroups.map((group) => (
      <GlowCard key={group.title} as="section" aria-labelledby={`more-${group.title}`}>
        <CardHeader id={`more-${group.title}`} title={group.title} />
        <CardBody>
          <ul className="grid grid-cols-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-8 2xl:grid-cols-10">
            {group.items.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="flex flex-col items-center gap-2 text-center text-xs text-neutral-300">
                  <IconTile icon={icons[item.icon]} size="md" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </CardBody>
      </GlowCard>
    ))}
  </div>
);
