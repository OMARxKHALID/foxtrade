import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { MenuRow } from "@/components/ui/menu-row";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollText } from "lucide-react";
import packageJson from "../../../../../package.json";

export const metadata = {
  title: "Settings",
};

const SettingsPage = () => (
  <Container className="flex flex-col gap-4 lg:gap-6">
    <PageHeader title="Settings" backHref="/account" />
    <GlowCard className="max-w-3xl p-2">
      <MenuRow href="/legal/terms" icon={ScrollText} label="Terms & Policies" description="Terms, privacy and risk disclosure" />
      <div className="flex items-center justify-between px-4 py-3.5 text-sm">
        <span className="text-white">Version</span>
        <span className="text-neutral-500">{packageJson.version}</span>
      </div>
    </GlowCard>
  </Container>
);

export default SettingsPage;
