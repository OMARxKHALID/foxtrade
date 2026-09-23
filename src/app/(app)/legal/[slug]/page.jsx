import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { getContent, getPlatformSettings } from "@/lib/cached-settings";
import { documentsInGroup, fillPlaceholders } from "@/lib/content/content-registry";
import { cn } from "@/lib/utils";
import { longDate as dateFormat } from "@/lib/format";

const legalDocuments = documentsInGroup("Legal");


export const generateStaticParams = () => legalDocuments.map((doc) => ({ slug: doc.slug }));

const findDocument = (slug) => legalDocuments.find((doc) => doc.slug === slug);

export const generateMetadata = async ({ params }) => {
  const { slug } = await params;
  const doc = findDocument(slug);
  return { title: doc ? (await getContent(doc.key)).title : "Legal" };
};

const LegalPage = async ({ params }) => {
  const { slug } = await params;
  const doc = findDocument(slug);
  if (!doc) notFound();
  const [settings, ...pages] = await Promise.all([getPlatformSettings(), ...legalDocuments.map((item) => getContent(item.key))]);
  const page = pages[legalDocuments.indexOf(doc)];

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={page.title} description={`Last updated ${dateFormat.format(new Date(page.updatedAt ?? doc.meta.updated))}`} />
      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <GlowCard as="nav" aria-label="Legal documents" className="h-fit p-2">
          <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
            {legalDocuments.map((item, index) => (
              <li key={item.key}>
                <Link
                  href={`/legal/${item.slug}`}
                  aria-current={item.slug === slug ? "page" : undefined}
                  className={cn("block rounded-lg px-3 py-2 text-sm whitespace-nowrap", item.slug === slug ? "bg-white/5 text-brand" : "text-neutral-300")}
                >
                  {pages[index].title}
                </Link>
              </li>
            ))}
          </ul>
        </GlowCard>
        <GlowCard as="article" className="p-4 sm:p-6">
          <div className="flex max-w-3xl flex-col gap-8">
            {page.sections.map((section, index) => (
              <section key={`${index}-${section.heading}`}>
                <h2 className="font-heading text-base font-semibold text-white">{fillPlaceholders(section.heading, settings)}</h2>
                <p className="mt-2 text-sm leading-7 whitespace-pre-line text-neutral-300">{fillPlaceholders(section.body, settings)}</p>
              </section>
            ))}
          </div>
        </GlowCard>
      </div>
    </Container>
  );
};

export default LegalPage;
