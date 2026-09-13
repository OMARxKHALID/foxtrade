import Link from "next/link";
import { Activity, BookOpen, Headset, ShieldCheck, Wallet, Zap } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { legalPages } from "@/lib/content/legal";
import { site } from "@/lib/site";

export const metadata = {
  title: "About Us",
};

const principles = [
  { icon: Activity, title: "Real market data", text: "Prices, candles, order books and trades stream live from Binance public market data." },
  { icon: Wallet, title: "Demo balances only", text: "Every account trades with demo USDT. Nothing is deposited, nothing leaves the platform." },
  { icon: ShieldCheck, title: "Honest settlement", text: "Trades settle at the recorded market price. The platform never sets prices or results." },
  { icon: Zap, title: "Two ways to trade", text: "Timed futures for short predictions and perpetual options with leverage and TP/SL." },
];

const AboutPage = () => (
  <Container className="flex flex-col gap-4 lg:gap-6">
    <PageHeader title="About Us" description={site.tagline} />
    <GlowCard variant="warm">
      <CardBody className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">Practice trading without risking money</h2>
          <p className="mt-3 text-sm leading-7 text-neutral-400">
            {site.name} is a simulated trading platform. It pairs live crypto market data with demo wallets so you can learn how timed trades,
            leverage, margin and liquidation work before trading real assets anywhere else.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <GradientButton href="/register">Create Account</GradientButton>
          <GradientButton href="/markets" variant="dark">
            View Markets
          </GradientButton>
        </div>
      </CardBody>
    </GlowCard>
    <ul className="grid gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
      {principles.map((item) => (
        <li key={item.title}>
          <GlowCard className="h-full">
            <CardBody>
              <IconTile icon={item.icon} size="md" />
              <h3 className="mt-4 font-heading text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{item.text}</p>
            </CardBody>
          </GlowCard>
        </li>
      ))}
    </ul>
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <GlowCard as="section" aria-labelledby="about-legal-title">
        <CardHeader id="about-legal-title" title="Policies" />
        <CardBody>
          <ul className="flex flex-col gap-3">
            {Object.entries(legalPages).map(([slug, page]) => (
              <li key={slug}>
                <Link href={`/legal/${slug}`} className="flex items-center gap-3 text-sm text-neutral-300">
                  <BookOpen className="size-4 text-brand" />
                  {page.title}
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

export default AboutPage;
