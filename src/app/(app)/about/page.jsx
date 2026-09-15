import Link from "next/link";
import { Activity, BookOpen, Headset, ShieldCheck, Wallet, Zap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { getContent, getPlatformSettings } from "@/lib/cached-settings";
import { documentsInGroup, fillPlaceholders } from "@/lib/content/content-registry";

export const metadata = {
  title: "About Us",
};

const principleIcons = [Activity, Wallet, ShieldCheck, Zap];

const legalDocuments = documentsInGroup("Legal");

const AboutPage = async () => {
  const [settings, about, ...legalPages] = await Promise.all([getPlatformSettings(), getContent("about"), ...legalDocuments.map((doc) => getContent(doc.key))]);
  const fill = (value) => fillPlaceholders(value, settings);
  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="About Us" description={settings.tagline} />
      <GlowCard variant="warm">
        <CardBody className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">{fill(about.title)}</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-400">{fill(about.summary)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <GradientButton href="/register">Sign Up</GradientButton>
            <GradientButton href="/markets" variant="dark">
              View Markets
            </GradientButton>
          </div>
        </CardBody>
      </GlowCard>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {about.sections.map((item, index) => (
          <li key={`${index}-${item.heading}`}>
            <GlowCard className="h-full">
              <CardBody>
                <IconTile icon={principleIcons[index % principleIcons.length]} size="md" />
                <h3 className="mt-4 font-heading text-base font-semibold text-white">{fill(item.heading)}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{fill(item.body)}</p>
              </CardBody>
            </GlowCard>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <GlowCard as="section" aria-labelledby="about-legal-title">
          <CardHeader id="about-legal-title" title="Policies" />
          <CardBody>
            <ul className="flex flex-col gap-3">
              {legalDocuments.map((doc, index) => (
                <li key={doc.key}>
                  <Link href={`/legal/${doc.slug}`} className="flex items-center gap-3 text-sm text-neutral-300">
                    <BookOpen className="size-4 text-brand" />
                    {legalPages[index].title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="about-contact-title">
          <CardHeader id="about-contact-title" title="Contact" />
          <CardBody className="flex flex-col items-start gap-4">
            <p className="text-sm leading-6 text-neutral-400">Questions, feedback or a problem with your account? Our support team answers every ticket.</p>
            <GradientButton href="/support" variant="dark" size="sm">
              <Headset className="size-4" />
              Contact Support
            </GradientButton>
          </CardBody>
        </GlowCard>
      </div>
    </Container>
  );
};

export default AboutPage;
