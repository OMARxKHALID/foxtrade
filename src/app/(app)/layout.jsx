import { AppNavbar } from "@/components/layout/app-navbar";
import { TabBar } from "@/components/layout/tab-bar";
import { getCurrentUser, toUserDTO } from "@/lib/session";
import { signOut } from "@/features/auth/actions/auth-actions";

const AppLayout = async ({ children }) => {
  const user = toUserDTO(await getCurrentUser());

  return (
    <>
      <AppNavbar user={user} signOutAction={signOut} />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(120,45,10,0.18),transparent)]" />
      <main className="flex-1 pt-4 pb-24 lg:pt-6 lg:pb-12">{children}</main>
      <TabBar />
    </>
  );
};

export default AppLayout;
