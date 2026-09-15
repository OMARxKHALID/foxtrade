import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { getPlatformSettings } from "@/lib/cached-settings";

export const metadata = {
  title: "Invite Rules",
};

const steps = [
  { title: "Share your link", text: "Copy your invite link or show the QR code to a friend." },
  { title: "Friend signs up", text: "Your friend creates an account through the link." },
  { title: "Practice together", text: "Your friend gets the same demo funds as every new account." },
];

const rulesFor = (siteName) => [
  "Invites are for sharing the platform only. There are no commissions, rebates or team levels.",
  "An invited friend receives the same demo assets as any new account.",
  "Invite links cannot be used to follow, copy or push trades to another account.",
  "Accounts created in bulk or with fake details are removed.",
  `${siteName} may update these rules. Changes are announced in Notices.`,
];

const ShareRulesPage = async () => {
  const { siteName } = await getPlatformSettings();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Invite Rules" description={`How inviting friends works on ${siteName}.`} backHref="/account/share" />
      <ol className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        {steps.map((step, i) => (
          <li key={step.title}>
            <GlowCard variant={i === 0 ? "warm" : "plain"} className="h-full">
              <CardBody>
                <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-brand">{i + 1}</span>
                <h2 className="mt-4 font-heading text-base font-semibold text-white">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{step.text}</p>
              </CardBody>
            </GlowCard>
          </li>
        ))}
      </ol>
      <GlowCard as="section" aria-labelledby="invite-rules-title">
        <CardHeader id="invite-rules-title" title="Rules" />
        <CardBody>
          <ul className="flex flex-col gap-3">
            {rulesFor(siteName).map((rule) => (
              <li key={rule} className="flex gap-3 text-sm leading-6 text-neutral-300">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                {rule}
              </li>
            ))}
          </ul>
        </CardBody>
      </GlowCard>
    </Container>
  );
};

export default ShareRulesPage;
