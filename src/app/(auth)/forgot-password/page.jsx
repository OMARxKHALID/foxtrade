import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/auth-forms";

export const metadata = {
  title: "Forgot Password",
};

const ForgotPasswordPage = () => (
  <>
    <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Forgot Password</h1>
    <p className="mt-2 text-sm text-neutral-400">Enter your email and we will send you a reset code.</p>
    <div className="mt-8">
      <ForgotPasswordForm />
    </div>
    <p className="mt-8 text-center text-sm text-neutral-400">
      Remembered it? <Link href="/login" className="text-brand">Back to login</Link>
    </p>
  </>
);

export default ForgotPasswordPage;
