import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/auth-forms";

export const metadata = {
  title: "Sign Up",
};

const intro = "mt-2 text-sm text-neutral-400";

// Only the invite code needs the request, so it is the only part that waits.
// Everything around it still prerenders.
const InvitedSignup = async ({ searchParams }) => {
  const { ref } = await searchParams;
  const inviteCode = typeof ref === "string" && /^[A-Z2-9]{8}$/.test(ref) ? ref : undefined;

  return (
    <>
      <p className={intro}>
        {inviteCode ? "You were invited. Create your account to get a practice balance." : "Get a practice balance and start trading in minutes."}
      </p>
      <div className="mt-8">
        <RegisterForm inviteCode={inviteCode} />
      </div>
    </>
  );
};

const SignupFallback = () => (
  <>
    <p className={intro}>Get a practice balance and start trading in minutes.</p>
    <div className="mt-8 flex flex-col gap-5" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex flex-col gap-2">
          <span className="h-3 w-24 rounded bg-white/5" />
          <span className="h-11 rounded-lg bg-white/5" />
        </div>
      ))}
      <span className="h-11 rounded-lg bg-white/10" />
    </div>
  </>
);

const RegisterPage = ({ searchParams }) => (
  <>
    <h1 className="font-heading text-2xl font-bold tracking-tight text-white md:text-title">Sign Up</h1>
    <Suspense fallback={<SignupFallback />}>
      <InvitedSignup searchParams={searchParams} />
    </Suspense>
    <p className="mt-8 text-center text-sm text-neutral-400">
      Already have an account?{" "}
      <Link href="/login" className="text-brand">
        Log in
      </Link>
    </p>
  </>
);

export default RegisterPage;
