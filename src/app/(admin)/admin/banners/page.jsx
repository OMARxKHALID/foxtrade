import { PageHeader } from "@/components/ui/page-header";
import { listAllBanners } from "@/lib/content-store";
import { requireAdmin } from "@/lib/session";
import { BannersManager } from "@/features/admin/components/banners-manager";

export const metadata = {
  title: "Banners",
};

export const instant = false;

const AdminBannersPage = async () => {
  await requireAdmin();
  const banners = await listAllBanners();

  return (
    <>
      <PageHeader title="Banners" description="Slides in the home page carousel. Links must point inside the site." />
      <BannersManager banners={banners} />
    </>
  );
};

export default AdminBannersPage;
