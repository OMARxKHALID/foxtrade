import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { legalPages } from "@/lib/content/legal";
import { cn } from "@/lib/utils";

export const generateStaticParams = () => Object.keys(legalPages).map((slug) => ({ slug }));

export const generateMetadata = async ({ params }) => {
  const { slug } = await params;
  return { title: legalPages[slug]?.title ?? "Legal" };
};

const LegalPage = async ({ params }) => {
  const { slug } = await params;
  const page = legalPages[slug];
  if (!page) notFound();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={page.title} description={`Last updated ${page.updated}`} />
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <GlowCard as="nav" aria-label="Legal documents" className="h-fit p-2">
          <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
            {Object.entries(legalPages).map(([key, item]) => (
              <li key={key}>
                <Link
                  href={`/legal/${key}`}
                  aria-current={key === slug ? "page" : undefined}
                  className={cn("block rounded-lg px-3 py-2 text-sm whitespace-nowrap", key === slug ? "bg-white/5 text-brand" : "text-neutral-300")}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </GlowCard>
        <GlowCard as="article" className="p-4 sm:p-6">
          <div className="flex max-w-3xl flex-col gap-8">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-heading text-base font-semibold text-white">{section.heading}</h2>
                <p className="mt-2 text-sm leading-7 text-neutral-300">{section.text}</p>
              </section>
            ))}
          </div>
        </GlowCard>
      </div>
    </Container>
  );
};

export default LegalPage;
