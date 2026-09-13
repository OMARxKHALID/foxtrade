import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { RecordsView } from "@/features/assets/components/records-view";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";

export const metadata = {
  title: "Records",
};

export const instant = false;

const RecordsPage = async () => {
  const { records } = await loadAssetsPage({ records: true });

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Records" description="Deposits, withdrawals, conversions, transfers and trade settlements." backHref="/assets" />
      <RecordsView records={records} />
    </Container>
  );
};

export default RecordsPage;
