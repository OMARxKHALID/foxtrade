"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { cn } from "@/lib/utils";
import { requestPasswordReset, resetPassword, signIn, signUp } from "@/features/auth/actions/auth-actions";
import { emailSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/features/auth/schemas/auth-schema";

const useActionForm = (schema, action, defaultValues) => {
  const form = useForm({ resolver: zodResolver(schema), defaultValues });
  const { pending, submit } = useActionSubmit({ action, setError: form.setError });
  const onSubmit = form.handleSubmit(submit);

  return { ...form, pending, onSubmit };
};

const PasswordInput = ({ id, invalid, autoComplete, registration }) => {
  const [visible, setVisible] = useState(false);
  const handleToggle = () => setVisible((value) => !value);
  return (
    <div className="relative">
      <input id={id} type={visible ? "text" : "password"} autoComplete={autoComplete} aria-invalid={invalid} className={cn(controlClass, "pr-11")} {...registration} />
      <button type="button" onClick={handleToggle} aria-label={visible ? "Hide password" : "Show password"} className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500">
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
};

export const LoginForm = ({ next }) => {
  const { register, control, pending, onSubmit, formState } = useActionForm(loginSchema, signIn, { email: "", password: "", remember: true, next });
  const { errors } = formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="login-email" label="Email" error={errors.email?.message}>
        <input id="login-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={controlClass} {...register("email")} />
      </Field>
      <Field id="login-password" label="Password" error={errors.password?.message} aside={<Link href="/forgot-password" className="text-xs text-brand">Forgot password?</Link>}>
        <PasswordInput id="login-password" autoComplete="current-password" invalid={Boolean(errors.password)} registration={register("password")} />
      </Field>
      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <Controller name="remember" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
        Remember me
      </label>
      <GradientButton type="submit" disabled={pending} className="w-full">
        {pending ? "Logging in…" : "Log In"}
      </GradientButton>
    </form>
  );
};

export const RegisterForm = () => {
  const { register, control, pending, onSubmit, formState } = useActionForm(registerSchema, signUp, {
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const { errors } = formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="register-email" label="Email" error={errors.email?.message}>
        <input id="register-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={controlClass} {...register("email")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="register-password" label="Password" error={errors.password?.message}>
          <PasswordInput id="register-password" autoComplete="new-password" invalid={Boolean(errors.password)} registration={register("password")} />
        </Field>
        <Field id="register-confirm" label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput id="register-confirm" autoComplete="new-password" invalid={Boolean(errors.confirmPassword)} registration={register("confirmPassword")} />
        </Field>
      </div>
      <div>
        <label className="flex items-start gap-2 text-xs leading-5 text-neutral-300">
          <Controller name="terms" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(errors.terms)} className="mt-0.5" />} />
          <span>
            I agree to the <Link href="/legal/terms" className="text-brand">Terms of Service</Link> and{" "}
            <Link href="/legal/privacy" className="text-brand">Privacy Policy</Link>, and understand this is a demo trading platform.
          </span>
        </label>
        {errors.terms && <p className="mt-2 text-xs text-down">{errors.terms.message}</p>}
      </div>
      <GradientButton type="submit" disabled={pending} className="w-full">
        {pending ? "Signing up…" : "Sign Up"}
      </GradientButton>
    </form>
  );
};

export const ForgotPasswordForm = () => {
  const { register, pending, onSubmit, formState } = useActionForm(emailSchema, requestPasswordReset, { email: "" });
  const { errors } = formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="forgot-email" label="Email" error={errors.email?.message}>
        <input id="forgot-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={controlClass} {...register("email")} />
      </Field>
      <GradientButton type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send Reset Code"}
      </GradientButton>
      <Link href="/reset-password" className="text-center text-xs text-brand">
        Already have a code?
      </Link>
    </form>
  );
};

export const ResetPasswordForm = ({ email }) => {
  const { register, pending, onSubmit, formState } = useActionForm(resetPasswordSchema, resetPassword, { email: email ?? "", code: "", password: "", confirmPassword: "" });
  const { errors } = formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="reset-email" label="Email" error={errors.email?.message}>
        <input id="reset-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={controlClass} {...register("email")} />
      </Field>
      <Field id="reset-code" label="Reset code" error={errors.code?.message}>
        <input id="reset-code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" aria-invalid={Boolean(errors.code)} className={controlClass} {...register("code")} />
      </Field>
      <Field id="reset-password" label="New password" error={errors.password?.message}>
        <PasswordInput id="reset-password" autoComplete="new-password" invalid={Boolean(errors.password)} registration={register("password")} />
      </Field>
      <Field id="reset-confirm" label="Confirm new password" error={errors.confirmPassword?.message}>
        <PasswordInput id="reset-confirm" autoComplete="new-password" invalid={Boolean(errors.confirmPassword)} registration={register("confirmPassword")} />
      </Field>
      <GradientButton type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Reset Password"}
      </GradientButton>
    </form>
  );
};
