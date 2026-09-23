import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ModeBadge } from "@/features/assets/components/mode-badge";
import { RecordsView } from "@/features/assets/components/records-view";
import { RECORDS_LIMIT, loadAssetsPage } from "@/features/assets/dal/assets-dal";

export const metadata = {
  title: "Records",
};

export const instant = false;

const RecordsPage = async () => {
  const { records, mode, signedIn } = await loadAssetsPage({ records: true });

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Records" description="Deposits, withdrawals, conversions, transfers and trade settlements." backHref="/assets" actions={signedIn ? <ModeBadge mode={mode} /> : null} />
      <RecordsView records={records} limit={RECORDS_LIMIT} mode={mode} />
    </Container>
  );
};

export default RecordsPage;
