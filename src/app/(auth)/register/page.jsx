import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/auth-forms";

export const metadata = {
  title: "Sign Up",
};

const RegisterPage = async ({ searchParams }) => {
  const { ref } = await searchParams;
  const inviteCode = typeof ref === "string" && /^[A-Z2-9]{8}$/.test(ref) ? ref : undefined;

  return (
    <>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-white md:text-title">Sign Up</h1>
      <p className="mt-2 text-sm text-neutral-400">
        {inviteCode ? "You were invited. Create your account to get a practice balance." : "Get a practice balance and start trading in minutes."}
      </p>
      <div className="mt-8">
        <RegisterForm inviteCode={inviteCode} />
      </div>
      <p className="mt-8 text-center text-sm text-neutral-400">
        Already have an account? <Link href="/login" className="text-brand">Log in</Link>
      </p>
    </>
  );
};

export default RegisterPage;
