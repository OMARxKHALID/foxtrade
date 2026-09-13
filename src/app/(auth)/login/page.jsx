import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoginForm } from "@/features/auth/components/auth-forms";

export const metadata = {
  title: "Login",
};

const LoginPage = async ({ searchParams }) => {
  const { next, reset } = await searchParams;

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Login</h1>
      <p className="mt-2 text-sm text-neutral-400">Welcome back. Sign in to your account.</p>
      <div className="mt-8">
        {reset && <StatusBadge tone="success" className="mb-5">Password updated. Sign in with your new password.</StatusBadge>}
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </div>
      <p className="mt-8 text-center text-sm text-neutral-400">
        New to Foxtrade? <Link href="/register" className="text-brand">Create an account</Link>
      </p>
    </>
  );
};

export default LoginPage;
