import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/auth-forms";

export const metadata = {
  title: "Create Account",
};

const RegisterPage = () => (
  <>
    <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Create Account</h1>
    <p className="mt-2 text-sm text-neutral-400">Get a demo balance and start trading in minutes.</p>
    <div className="mt-8">
      <RegisterForm />
    </div>
    <p className="mt-8 text-center text-sm text-neutral-400">
      Already have an account? <Link href="/login" className="text-brand">Login</Link>
    </p>
  </>
);

export default RegisterPage;
