import Link from "next/link";
import { redirect } from "next/navigation";
import { CandleBackdrop } from "@/components/ui/candle-backdrop";
import { LogoMark } from "@/components/ui/logo-mark";
import { getCurrentUser } from "@/lib/session";
import { getPlatformSettings } from "@/lib/cached-settings";

export const instant = false;

const AuthLayout = async ({ children }) => {
  if (await getCurrentUser()) redirect("/");
  const { siteName, tagline } = await getPlatformSettings();

  return (
    <div className="grid grid-cols-1 min-h-screen flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 md:px-12 md:py-10">
        <Link href="/" className="flex items-center gap-2.5 self-start" aria-label={`${siteName} home`}>
          <LogoMark />
          <span className="font-heading text-sm font-semibold text-white">{siteName}</span>
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <p className="text-xs text-neutral-600">
          © {siteName}. Demo trading platform · <Link href="/legal/risk" className="text-neutral-400">Risk disclosure</Link>
        </p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-white/10 bg-black lg:block">
        <CandleBackdrop />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-x-12 bottom-14">
          <p className="font-heading text-4xl leading-tight font-bold tracking-tight text-white">{tagline}</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-neutral-300">
            Live prices, pro charts and a free demo balance. Learn to trade without risking your savings.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default AuthLayout;
