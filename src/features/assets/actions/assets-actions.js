"use server";

import { serverFailure, signInRequired, validationFailure } from "@/lib/action-result";
import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { checkWithdrawal, claimFaucet, convertAssets as convert, deleteAddress, saveAddress, transferAssets as transfer } from "@/features/assets/dal/assets-dal";
import { addressSchema, convertSchema, transferSchema, withdrawSchema } from "@/features/assets/schemas/assets-schema";

const withUser = async (message, work) => {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return signInRequired(message);
  try {
    const limit = await rateLimit(`assets:${user.id}`, { limit: 20, windowSeconds: 60 });
    if (!limit.allowed) return tooManyAttempts(limit.retryAfter);
    return (await work(user)) ?? { ok: true };
  } catch (error) {
    return serverFailure(error);
  }
};

export const requestWithdrawal = async (input) => {
  const parsed = withdrawSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return withUser("Log in to manage withdrawals.", (user) => checkWithdrawal(user.id, parsed.data));
};

export const convertAssets = async (input) => {
  const parsed = convertSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return withUser("Log in to convert assets.", async (user) => ({ ok: true, data: await convert(user.id, parsed.data) }));
};

export const transferAssets = async (input) => {
  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return withUser("Log in to transfer between wallets.", (user) => transfer(user.id, parsed.data));
};

export const claimDemoAssets = async () => withUser("Log in to claim demo assets.", (user) => claimFaucet(user.id));

export const saveWithdrawalAddress = async (input) => {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return withUser("Log in to save withdrawal addresses.", (user) => saveAddress(user.id, parsed.data));
};

export const removeWithdrawalAddress = async (id) => withUser("Log in to manage addresses.", (user) => deleteAddress(user.id, String(id)));
