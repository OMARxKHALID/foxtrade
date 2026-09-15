import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPlatformSettings } from "@/lib/cached-settings";
import { LoginForm } from "@/features/auth/components/auth-forms";

export const metadata = {
  title: "Log In",
};

export const instant = false;

const LoginPage = async ({ searchParams }) => {
  const [{ next, reset }, { siteName }] = await Promise.all([searchParams, getPlatformSettings()]);

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Log In</h1>
      <p className="mt-2 text-sm text-neutral-400">Welcome back. Log in to your account.</p>
      <div className="mt-8">
        {reset && <StatusBadge tone="success" className="mb-5">Password updated. Log in with your new password.</StatusBadge>}
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </div>
      <p className="mt-8 text-center text-sm text-neutral-400">
        New to {siteName}? <Link href="/register" className="text-brand">Sign up</Link>
      </p>
    </>
  );
};

export default LoginPage;
