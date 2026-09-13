import { Headset } from "lucide-react";
import { AccordionList } from "@/components/ui/accordion-list";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeader } from "@/components/ui/page-header";
import { helpTopics } from "@/lib/content/help";

export const metadata = {
  title: "Help Center",
};

const HelpPage = () => (
  <Container className="flex flex-col gap-4 lg:gap-6">
    <PageHeader
      title="Help Center"
      description="Answers to common questions about trading, accounts and security."
      actions={
        <GradientButton href="/support" size="sm">
          <Headset className="size-4" />
          Contact Support
        </GradientButton>
      }
    />
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
      <GlowCard as="nav" aria-label="Help topics" className="h-fit p-2 lg:sticky lg:top-24">
        <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
          {helpTopics.map((topic) => (
            <li key={topic.id}>
              <a href={`#${topic.id}`} className="block rounded-lg px-3 py-2 text-sm whitespace-nowrap text-neutral-300">
                {topic.title}
              </a>
            </li>
          ))}
        </ul>
      </GlowCard>
      <div className="flex flex-col gap-4 lg:gap-6">
        {helpTopics.map((topic) => (
          <GlowCard key={topic.id} as="section" id={topic.id} aria-labelledby={`${topic.id}-title`} className="scroll-mt-24">
            <CardHeader id={`${topic.id}-title`} title={topic.title} />
            <CardBody>
              <AccordionList items={topic.questions} idPrefix={topic.id} />
            </CardBody>
          </GlowCard>
        ))}
      </div>
    </div>
  </Container>
);

export default HelpPage;
