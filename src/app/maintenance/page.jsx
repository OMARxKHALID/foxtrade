import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { getPlatformSettings } from "@/lib/cached-settings";

export const metadata = {
  title: "Under maintenance",
};

const MaintenancePage = async () => {
  const { maintenanceMode, maintenanceMessage, siteName, supportEmail } = await getPlatformSettings();
  if (!maintenanceMode) redirect("/");

  return (
    <Container>
      <GlowCard className="mx-auto mt-16 flex max-w-lg flex-col items-center gap-4 px-6 py-14 text-center">
        <Wrench className="size-8 text-brand" strokeWidth={1.5} />
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white">{siteName} is under maintenance</h1>
        <p className="max-w-sm text-sm leading-6 text-neutral-400">{maintenanceMessage}</p>
        {supportEmail && (
          <GradientButton href={`mailto:${supportEmail}`} variant="dark" size="sm">
            Contact Support
          </GradientButton>
        )}
      </GlowCard>
    </Container>
  );
};

export default MaintenancePage;
