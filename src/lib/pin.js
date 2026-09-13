import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { collections } from "@/lib/mongo";

const scryptAsync = promisify(scrypt);

export const setPin = async (userId, pin) => {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(pin, salt, 64)).toString("hex");
  await collections.security().updateOne({ userId }, { $set: { pinHash: hash, pinSalt: salt, pinUpdatedAt: new Date() } }, { upsert: true });
};

export const hasPin = async (userId) => Boolean((await collections.security().findOne({ userId }))?.pinHash);

export const verifyPin = async (userId, pin) => {
  const doc = await collections.security().findOne({ userId });
  if (!doc?.pinHash) return false;
  const hash = await scryptAsync(pin, doc.pinSalt, 64);
  return timingSafeEqual(hash, Buffer.from(doc.pinHash, "hex"));
};
