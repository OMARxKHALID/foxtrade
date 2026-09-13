import { PageHeader } from "@/components/ui/page-header";
import { listAllNotices } from "@/lib/content-store";
import { requireAdmin } from "@/lib/session";
import { NoticesManager } from "@/features/admin/components/notices-manager";

export const metadata = {
  title: "Notices",
};

const AdminNoticesPage = async () => {
  await requireAdmin();
  const notices = await listAllNotices();

  return (
    <>
      <PageHeader title="Notices" description="Announcements shown in the home notice bar and the notice center." />
      <NoticesManager notices={notices} />
    </>
  );
};

export default AdminNoticesPage;
