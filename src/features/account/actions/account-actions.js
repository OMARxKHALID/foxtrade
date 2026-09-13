"use server";

import { headers } from "next/headers";
import { formFailure, serverFailure, signInRequired, validationFailure } from "@/lib/action-result";
import { getAuth } from "@/lib/auth";
import { collections } from "@/lib/mongo";
import { setPin } from "@/lib/pin";
import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { basicVerificationSchema, changePasswordSchema, withdrawalPinSchema } from "@/features/account/schemas/account-schema";

export const submitBasicVerification = async (input) => {
  const parsed = basicVerificationSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser();
  if (!user) return signInRequired("Sign in to submit verification.");
  try {
    const limit = await rateLimit(`kyc-submit:${user.id}`, { limit: 5, windowSeconds: 3600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    const existing = await collections.verifications().findOne({ userId: user.id });
    if (existing?.status === "approved") return formFailure("Your identity is already verified.");
    if (existing?.status === "pending") return formFailure("Your verification is already under review.");
    await collections.verifications().updateOne(
      { userId: user.id },
      { $set: { ...parsed.data, userId: user.id, email: user.email, status: "pending", reason: null, submittedAt: new Date(), reviewedAt: null } },
      { upsert: true },
    );
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

export const changePassword = async (input) => {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser();
  if (!user) return signInRequired("Sign in to change your password.");
  try {
    const limit = await rateLimit(`password-change:${user.id}`, { limit: 5, windowSeconds: 900 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    await getAuth().api.changePassword({
      body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

export const setWithdrawalPin = async (input) => {
  const parsed = withdrawalPinSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser();
  if (!user) return signInRequired("Sign in to set a withdrawal PIN.");
  try {
    const limit = await rateLimit(`pin-set:${user.id}`, { limit: 5, windowSeconds: 3600 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    await setPin(user.id, parsed.data.pin);
    return { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};
