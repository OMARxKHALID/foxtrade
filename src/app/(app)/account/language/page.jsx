import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { LanguageList } from "@/features/account/components/preference-settings";

export const metadata = {
  title: "Language",
};

const LanguagePage = () => (
  <Container className="flex flex-col gap-4 lg:gap-6">
    <PageHeader title="Language" description="Full translations are rolling out. Your choice is saved on this device." backHref="/account" />
    <GlowCard className="p-4 sm:p-6">
      <LanguageList />
    </GlowCard>
  </Container>
);

export default LanguagePage;
