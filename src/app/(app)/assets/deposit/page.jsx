import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { PracticeFaucet } from "@/features/assets/components/practice-faucet";
import { getPlatformSettings } from "@/lib/cached-settings";
import { getCurrentUser } from "@/lib/session";
import { getFaucetStatus } from "@/features/assets/dal/assets-dal";

export const metadata = {
  title: "Deposit",
};

export const instant = false;

const DepositPage = async () => {
  const [user, { siteName }] = await Promise.all([getCurrentUser(), getPlatformSettings()]);
  const status = user ? await getFaucetStatus(user.id) : null;

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Deposit" description={`${siteName} runs on practice funds. Claim USDT to start trading.`} backHref="/assets" />
      <PracticeFaucet status={status} />
    </Container>
  );
};

export default DepositPage;
