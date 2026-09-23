import { PageHeader } from "@/components/ui/page-header";
import { listPendingApprovals } from "@/features/admin/dal/admin-dal";
import { ApprovalsPanels } from "@/features/admin/components/approvals-panels";

export const metadata = {
  title: "Approvals",
};

export const instant = false;

const ApprovalsPage = async () => {
  const { deposits, withdrawals, adjustments } = await listPendingApprovals();

  return (
    <>
      <PageHeader title="Approvals" description="Deposits and withdrawals waiting for review, and live balance changes raised by another admin." />
      <ApprovalsPanels deposits={deposits} withdrawals={withdrawals} adjustments={adjustments} />
    </>
  );
};

export default ApprovalsPage;
