import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { DemoFaucet } from "@/features/assets/components/demo-faucet";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";

export const metadata = {
  title: "Deposit",
};

export const instant = false;

const DepositPage = async () => {
  const { overview } = await loadAssetsPage();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Deposit" description="Foxtrade runs on demo funds. Claim USDT to start trading." backHref="/assets" />
      <DemoFaucet spotUsdt={overview ? overview.holdings.USDT?.byWallet.spot ?? 0 : null} />
    </Container>
  );
};

export default DepositPage;
