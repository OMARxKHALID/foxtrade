import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { LiveDeposit } from "@/features/assets/components/live-deposit";
import { ModeBadge } from "@/features/assets/components/mode-badge";
import { PracticeFaucet } from "@/features/assets/components/practice-faucet";
import { getPlatformSettings } from "@/lib/cached-settings";
import { LIVE } from "@/lib/ledger";
import { getCurrentUser } from "@/lib/session";
import { resolveMode } from "@/lib/trading-mode";
import { getFaucetStatus } from "@/features/assets/dal/assets-dal";
import { listDeposits } from "@/features/assets/dal/funding-dal";

export const metadata = {
  title: "Deposit",
};

export const instant = false;

const DepositPage = async () => {
  const [user, { siteName, depositAddresses, minDeposit }] = await Promise.all([getCurrentUser().catch(() => null), getPlatformSettings()]);
  const mode = await resolveMode(user);

  if (user && mode === LIVE) {
    const deposits = await listDeposits(user.id, LIVE);
    return (
      <Container className="flex flex-col gap-4 lg:gap-6">
        <PageHeader title="Deposit" description="Add real USDT to your live account." backHref="/assets" actions={<ModeBadge mode={LIVE} />} />
        <LiveDeposit
          addresses={depositAddresses}
          minDeposit={minDeposit}
          deposits={deposits.map((item) => ({
            id: item._id.toString(),
            asset: item.asset,
            amount: item.amount,
            network: item.network ?? "",
            status: item.status,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </Container>
    );
  }

  const status = user ? await getFaucetStatus(user.id) : null;

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        title="Deposit"
        description={`Your ${siteName} practice account runs on practice funds. Claim USDT to start trading.`}
        backHref="/assets"
        actions={user ? <ModeBadge mode="practice" /> : null}
      />
      <PracticeFaucet status={status} />
    </Container>
  );
};

export default DepositPage;
