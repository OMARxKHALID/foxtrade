import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/components/auth-forms";

export const metadata = {
  title: "Reset Password",
};

export const instant = false;

const ResetPasswordPage = async ({ searchParams }) => {
  const { email } = await searchParams;

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Reset Password</h1>
      <p className="mt-2 text-sm text-neutral-400">Enter the code from your email and choose a new password.</p>
      <div className="mt-8">
        <ResetPasswordForm email={typeof email === "string" ? email : ""} />
      </div>
      <p className="mt-8 text-center text-sm text-neutral-400">
        Need a new code? <Link href="/forgot-password" className="text-brand">Resend</Link>
      </p>
    </>
  );
};

export default ResetPasswordPage;
