import { Suspense } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPlatformSettings } from "@/lib/cached-settings";
import { LoginForm } from "@/features/auth/components/auth-forms";

export const metadata = {
  title: "Log In",
};

// The form needs the request to know where to send you afterwards; the page
// around it does not, so only this part waits.
const SignInPanel = async ({ searchParams }) => {
  const { next, reset } = await searchParams;

  return (
    <>
      {reset && (
        <StatusBadge tone="success" className="mb-5">
          Password updated. Log in with your new password.
        </StatusBadge>
      )}
      <LoginForm next={typeof next === "string" ? next : "/"} />
    </>
  );
};

const SignInFallback = () => (
  <div className="flex flex-col gap-5" aria-hidden="true">
    {[0, 1].map((row) => (
      <div key={row} className="flex flex-col gap-2">
        <span className="h-3 w-20 rounded bg-white/5" />
        <span className="h-11 rounded-lg bg-white/5" />
      </div>
    ))}
    <span className="h-11 rounded-lg bg-white/10" />
  </div>
);

const LoginPage = async ({ searchParams }) => {
  const { siteName } = await getPlatformSettings();

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-white md:text-title">Log In</h1>
      <p className="mt-2 text-sm text-neutral-400">Welcome back. Log in to your account.</p>
      <div className="mt-8">
        <Suspense fallback={<SignInFallback />}>
          <SignInPanel searchParams={searchParams} />
        </Suspense>
      </div>
      <p className="mt-8 text-center text-sm text-neutral-400">
        New to {siteName}?{" "}
        <Link href="/register" className="text-brand">
          Sign up
        </Link>
      </p>
    </>
  );
};

export default LoginPage;
