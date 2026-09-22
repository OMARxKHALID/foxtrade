import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppNavbar } from "@/components/layout/app-navbar";
import { TabBar } from "@/components/layout/tab-bar";
import { getPlatformSettings } from "@/lib/cached-settings";
import { getCurrentUser, toUserDTO } from "@/lib/session";
import { signOut } from "@/features/auth/actions/auth-actions";

const AppNavbarSignedIn = async () => {
  const user = toUserDTO(await getCurrentUser());
  return <AppNavbar user={user} signOutAction={signOut} />;
};

const AppLayout = async ({ children }) => {
  const { maintenanceMode } = await getPlatformSettings();
  if (maintenanceMode) redirect("/maintenance");

  return (
    <>
      <Suspense fallback={null}>
        <Suspense fallback={<AppNavbar user={null} signOutAction={signOut} />}>
          <AppNavbarSignedIn />
        </Suspense>
      </Suspense>
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(120,45,10,0.18),transparent)]" />
      <main className="flex-1 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pt-6 lg:pb-12">{children}</main>
      <Suspense fallback={null}>
        <TabBar />
      </Suspense>
    </>
  );
};

export default AppLayout;
