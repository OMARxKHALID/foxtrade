import { requireAdmin } from "@/lib/session";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export const instant = false;

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin",
  },
  robots: { index: false, follow: false },
};

const AdminLayout = async ({ children }) => {
  const admin = await requireAdmin();

  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[240px_minmax(0,1fr)]">
      <AdminSidebar email={admin.email} signOut={<SignOutButton className="w-full" />} mobileSignOut={<SignOutButton size="xs" />} />
      <main className="flex min-w-0 flex-col gap-4 px-4 py-6 sm:px-6 lg:gap-6 lg:px-8 lg:py-8 2xl:px-12">{children}</main>
    </div>
  );
};

export default AdminLayout;
