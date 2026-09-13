import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getNoticeBySlug } from "@/lib/content-store";

export const generateMetadata = async ({ params }) => {
  const { id } = await params;
  return { title: (await getNoticeBySlug(id))?.title ?? "Notice" };
};

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

const NoticePage = async ({ params }) => {
  const { id } = await params;
  const notice = await getNoticeBySlug(id);
  if (!notice) notFound();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={notice.title} backHref="/notices" />
      <GlowCard as="article" className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <StatusBadge tone="brand">{notice.category}</StatusBadge>
          <time dateTime={notice.date} className="text-xs text-neutral-500">
            {dateFormat.format(new Date(notice.date))}
          </time>
        </div>
        <div className="mt-6 flex max-w-3xl flex-col gap-4 text-sm leading-7 text-neutral-300">
          {notice.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </GlowCard>
    </Container>
  );
};

export default NoticePage;
