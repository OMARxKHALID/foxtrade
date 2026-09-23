import "server-only";
import { ObjectId } from "mongodb";
import { LIVE, PRACTICE } from "@/lib/ledger";
import { getPlatformSettings } from "@/lib/cached-settings";
import { collections } from "@/lib/mongo";

// Every gate must agree before a request touches real money, and anything
// missing or unreadable falls back to practice. There is no path that reaches
// LIVE by accident.
export const resolveMode = async (user) => {
  if (!user?.id || !ObjectId.isValid(user.id)) return PRACTICE;

  const { liveTradingEnabled } = await getPlatformSettings();
  if (!liveTradingEnabled) return PRACTICE;

  const [account, verification] = await Promise.all([
    collections.users().findOne({ _id: new ObjectId(user.id) }, { projection: { tradingMode: 1, banned: 1 } }),
    collections.verifications().findOne({ userId: user.id }, { projection: { status: 1 } }),
  ]);

  if (!account || account.banned) return PRACTICE;
  if (account.tradingMode !== LIVE) return PRACTICE;
  if (verification?.status !== "approved") return PRACTICE;

  return LIVE;
};

export const liveAvailableFor = async (user) => {
  if (!user?.id || !ObjectId.isValid(user.id)) return { available: false, reason: "signed-out" };
  const { liveTradingEnabled } = await getPlatformSettings();
  if (!liveTradingEnabled) return { available: false, reason: "disabled" };
  const verification = await collections.verifications().findOne({ userId: user.id }, { projection: { status: 1 } });
  if (verification?.status !== "approved") return { available: false, reason: "unverified" };
  return { available: true, reason: null };
};

export const setTradingMode = async (userId, mode) => {
  if (!ObjectId.isValid(userId)) return PRACTICE;
  if (mode === LIVE) {
    const { available } = await liveAvailableFor({ id: userId });
    if (!available) return PRACTICE;
  }
  const next = mode === LIVE ? LIVE : PRACTICE;
  await collections.users().updateOne({ _id: new ObjectId(userId) }, { $set: { tradingMode: next } });
  return next;
};
