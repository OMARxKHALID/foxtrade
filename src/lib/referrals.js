import "server-only";
import { randomBytes } from "node:crypto";
import { maskEmail } from "@/lib/format";
import { collections } from "@/lib/mongo";

const CODE_LENGTH = 8;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITED_LIMIT = 100;

export const inviteCodeSchema = /^[A-Z2-9]{8}$/;

let indexesReady;

const ensureIndexes = () => {
  indexesReady ??= Promise.all([
    collections.invites().createIndex({ userId: 1 }, { unique: true }),
    collections.invites().createIndex({ code: 1 }, { unique: true }),
    collections.invites().createIndex({ referrerId: 1, joinedAt: -1 }),
  ]);
  return indexesReady;
};

const newCode = () =>
  Array.from(randomBytes(CODE_LENGTH))
    .map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
    .join("");

const isDuplicate = (error) => error?.code === 11000;

const createInvite = async ({ userId, email, referrerId }) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const invite = { userId, email, code: newCode(), referrerId, joinedAt: new Date() };
      await collections.invites().insertOne(invite);
      return invite;
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      const existing = await collections.invites().findOne({ userId });
      if (existing) return existing;
    }
  }
  throw new Error("Could not generate an invite code");
};

export const getInvite = async (userId, email) => {
  await ensureIndexes();
  return (await collections.invites().findOne({ userId })) ?? (await createInvite({ userId, email, referrerId: null }));
};

export const recordSignup = async ({ userId, email, code }) => {
  await ensureIndexes();
  const referrer = inviteCodeSchema.test(code ?? "") ? await collections.invites().findOne({ code }) : null;
  const referrerId = referrer && referrer.userId !== userId ? referrer.userId : null;
  await createInvite({ userId, email, referrerId });
};

export const listInvited = async (referrerId) => {
  await ensureIndexes();
  const docs = await collections.invites().find({ referrerId }).sort({ joinedAt: -1 }).limit(INVITED_LIMIT).toArray();
  return docs.map((doc) => ({ id: doc.userId, email: maskEmail(doc.email), joinedAt: doc.joinedAt.toISOString() }));
};
