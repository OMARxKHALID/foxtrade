"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverFailure, validationFailure } from "@/lib/action-result";
import { getAuth } from "@/lib/auth";
import { clientIp, rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { emailSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/features/auth/schemas/auth-schema";

export const signIn = async (input) => {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { email, password, remember, next } = parsed.data;
  try {
    const ip = await clientIp();
    const [byEmail, byIp] = await Promise.all([
      rateLimit(`login:email:${email.toLowerCase()}`, { limit: 8, windowSeconds: 900 }),
      rateLimit(`login:ip:${ip}`, { limit: 30, windowSeconds: 900 }),
    ]);
    if (!byEmail.allowed || !byIp.allowed) return tooManyAttempts(Math.max(byEmail.retryAfter, byIp.retryAfter));
    await getAuth().api.signInEmail({ body: { email, password, rememberMe: remember ?? true }, headers: await headers() });
  } catch (error) {
    return serverFailure(error);
  }
  redirect(next);
};

export const signUp = async (input) => {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { email, password } = parsed.data;
  try {
    const limit = await rateLimit(`register:ip:${await clientIp()}`, { limit: 5, windowSeconds: 3600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    await getAuth().api.signUpEmail({ body: { email, password, name: email.split("@")[0] }, headers: await headers() });
  } catch (error) {
    return serverFailure(error);
  }
  redirect("/assets");
};

export const requestPasswordReset = async (input) => {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const [byEmail, byIp] = await Promise.all([
      rateLimit(`reset-request:email:${parsed.data.email.toLowerCase()}`, { limit: 3, windowSeconds: 900 }),
      rateLimit(`reset-request:ip:${await clientIp()}`, { limit: 10, windowSeconds: 900 }),
    ]);
    if (!byEmail.allowed || !byIp.allowed) return tooManyAttempts(Math.max(byEmail.retryAfter, byIp.retryAfter));
    await getAuth().api.requestPasswordResetEmailOTP({ body: { email: parsed.data.email } });
  } catch (error) {
    return serverFailure(error);
  }
  redirect(`/reset-password?email=${encodeURIComponent(parsed.data.email)}`);
};

export const resetPassword = async (input) => {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { email, code, password } = parsed.data;
  try {
    const limit = await rateLimit(`reset:email:${email.toLowerCase()}`, { limit: 6, windowSeconds: 900 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    await getAuth().api.resetPasswordEmailOTP({ body: { email, otp: code, password } });
  } catch (error) {
    return serverFailure(error);
  }
  redirect("/login?reset=1");
};

export const signOut = async () => {
  try {
    await getAuth().api.signOut({ headers: await headers() });
  } catch (error) {
    return serverFailure(error);
  }
  redirect("/");
};
