import { PageHeader } from "@/components/ui/page-header";
import { listErrors } from "@/lib/error-log";
import { requireAdmin } from "@/lib/session";
import { ErrorsTable } from "@/features/admin/components/errors-table";

export const metadata = {
  title: "Errors",
};

export const instant = false;

const ErrorsPage = async () => {
  await requireAdmin();
  const errors = await listErrors();

  return (
    <>
      <PageHeader title="Errors" description="Server failures your clients actually hit, grouped by cause." />
      <ErrorsTable errors={errors} />
    </>
  );
};

export default ErrorsPage;
