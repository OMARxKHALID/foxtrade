import { Container } from "@/components/ui/container";
import { GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { TransferForm } from "@/features/assets/components/transfer-form";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";

export const metadata = {
  title: "Transfer",
};

const TransferPage = async () => {
  const { overview } = await loadAssetsPage();

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Transfer" description="Move funds between your spot, futures and option wallets." backHref="/assets" />
      <GlowCard className="w-full max-w-2xl p-4 sm:p-6">
        <TransferForm holdings={overview?.holdings} />
      </GlowCard>
    </Container>
  );
};

export default TransferPage;
