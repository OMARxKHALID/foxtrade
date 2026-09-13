import { PageHeader } from "@/components/ui/page-header";
import { KycTable } from "@/features/admin/components/kyc-table";
import { listVerifications } from "@/features/admin/dal/admin-dal";

export const metadata = {
  title: "KYC Review",
};

const KycPage = async () => {
  const submissions = await listVerifications();

  return (
    <>
      <PageHeader title="KYC Review" description="Approve or reject identity submissions from clients." />
      <KycTable submissions={submissions} />
    </>
  );
};

export default KycPage;
