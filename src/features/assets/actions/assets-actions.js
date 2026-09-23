"use server";

import { formFailure, signInRequired, validationFailure } from "@/lib/action-result";
import { serverFailure } from "@/lib/server-result";
import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { LIVE } from "@/lib/ledger";
import { toBig } from "@/lib/money";
import { resolveMode } from "@/lib/trading-mode";
import { claimFaucet, convertAssets as convert, deleteAddress, saveAddress, submitWithdrawal, transferAssets as transfer } from "@/features/assets/dal/assets-dal";
import { createDepositIntent } from "@/features/assets/dal/funding-dal";
import { getPlatformSettings } from "@/lib/cached-settings";
import { addressSchema, convertSchema, depositSchema, transferSchema, withdrawSchema } from "@/features/assets/schemas/assets-schema";

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
  return withUser("Log in to manage withdrawals.", async (user) => submitWithdrawal(user.id, parsed.data, await resolveMode(user)));
};

export const convertAssets = async (input) => {
  const parsed = convertSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return withUser("Log in to convert assets.", async (user) => ({ ok: true, data: await convert(user.id, parsed.data, await resolveMode(user)) }));
};

export const transferAssets = async (input) => {
  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return withUser("Log in to transfer between wallets.", async (user) => transfer(user.id, parsed.data, await resolveMode(user)));
};

export const submitDeposit = async (input) => {
  const parsed = depositSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return withUser("Log in to deposit.", async (user) => {
    const mode = await resolveMode(user);
    // Answer "this is not a live account" before anything about amounts.
    if (mode !== LIVE) return formFailure("Switch to a live account to deposit real funds.");
    const { depositAddresses, minDeposit } = await getPlatformSettings();
    // Only a network the platform actually publishes an address for; otherwise
    // the money is sent somewhere nobody is watching.
    if (!depositAddresses.some((item) => item.network === parsed.data.network)) return formFailure("That network is not available right now.");
    if (toBig(parsed.data.amount).lt(minDeposit)) return formFailure(`The smallest deposit is ${minDeposit} USDT.`);
    const id = await createDepositIntent(user.id, { ...parsed.data, asset: "USDT", provider: "manual" }, mode);
    return { ok: true, data: { id } };
  });
};

export const claimPracticeAssets = async () => withUser("Log in to claim practice assets.", (user) => claimFaucet(user.id));

export const saveWithdrawalAddress = async (input) => {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return withUser("Log in to save withdrawal addresses.", (user) => saveAddress(user.id, parsed.data));
};

export const removeWithdrawalAddress = async (id) => withUser("Log in to manage addresses.", (user) => deleteAddress(user.id, String(id)));
