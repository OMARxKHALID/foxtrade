import { Apple, Monitor, Smartphone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { InstallCard } from "@/features/install/components/install-card";

export const metadata = {
  title: "Download App",
};

const platforms = [
  {
    id: "ios",
    icon: Apple,
    title: "iPhone & iPad",
    steps: ["Open this page in Safari.", "Tap the Share button.", "Choose Add to Home Screen, then Add."],
  },
  {
    id: "android",
    icon: Smartphone,
    title: "Android",
    steps: ["Open this page in Chrome.", "Tap Install App above, or open the ⋮ menu.", "Choose Install app and confirm."],
  },
  {
    id: "desktop",
    icon: Monitor,
    title: "Desktop",
    steps: ["Open this page in Chrome, Edge or Brave.", "Click Install App above, or the install icon in the address bar.", "Launch it from your apps or dock."],
  },
];

const DownloadPage = () => (
  <Container className="flex flex-col gap-4 lg:gap-6">
    <PageHeader title="Download App" description="Use Foxtrade as an installed app on any device." />
    <InstallCard />
    <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
      {platforms.map((platform) => (
        <GlowCard key={platform.title} as="section" aria-labelledby={`install-${platform.id}`}>
          <CardHeader
            id={`install-${platform.id}`}
            title={
              <span className="flex items-center gap-2">
                <platform.icon className="size-4 text-brand" />
                {platform.title}
              </span>
            }
          />
          <CardBody>
            <ol className="flex flex-col gap-4">
              {platform.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-neutral-400">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-neutral-400">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </CardBody>
        </GlowCard>
      ))}
    </div>
  </Container>
);

export default DownloadPage;
