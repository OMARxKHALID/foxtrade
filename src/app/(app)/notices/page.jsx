import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPlatformSettings } from "@/lib/cached-settings";
import { getPublishedNotices } from "@/lib/content-store";

export const metadata = {
  title: "Notices",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

const NoticesPage = async () => {
  const [notices, { siteName }] = await Promise.all([getPublishedNotices(), getPlatformSettings()]);

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Notices" description="Announcements, product updates and security news." />
      <GlowCard className="p-2">
        {notices.length ? (
          <ul className="divide-y divide-white/5">
            {notices.map((notice) => (
              <li key={notice.slug}>
                <Link href={`/notices/${notice.slug}`} className="flex items-center gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-white/[0.03]">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="brand">{notice.category}</StatusBadge>
                      <time dateTime={notice.date} className="text-xs text-neutral-500">
                        {dateFormat.format(new Date(notice.date))}
                      </time>
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{notice.title}</p>
                    <p className="mt-1 truncate text-xs text-neutral-400">{notice.summary}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-neutral-500" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Bell} title="No notices yet" text={`Announcements from the ${siteName} team appear here.`} />
        )}
      </GlowCard>
    </Container>
  );
};

export default NoticesPage;
