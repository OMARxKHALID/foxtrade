import { PageHeader } from "@/components/ui/page-header";
import { readPlatformSettings } from "@/lib/platform-settings";
import { requireAdmin } from "@/lib/session";
import { PlatformSettingsForm } from "@/features/admin/components/platform-settings-form";

export const metadata = {
  title: "Settings",
};

export const instant = false;

const SettingsPage = async () => {
  await requireAdmin();
  const settings = await readPlatformSettings();

  return (
    <>
      <PageHeader title="Platform Settings" description="Site identity, practice funds, fees and timed trade payouts. Changes apply to new trades immediately." />
      <PlatformSettingsForm settings={settings} />
    </>
  );
};

export default SettingsPage;
