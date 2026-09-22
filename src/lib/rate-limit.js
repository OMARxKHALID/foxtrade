import "server-only";
import { headers } from "next/headers";
import { collections } from "@/lib/mongo";

let indexReady;

const ensureIndex = () => {
  indexReady ??= collections.rateLimits().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return indexReady;
};

export const clientIp = async () => {
  const list = await headers();
  return list.get("x-real-ip") ?? list.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
};

export const rateLimit = async (key, { limit, windowSeconds }) => {
  await ensureIndex();
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
  const id = `${key}:${windowStart}`;
  const doc = await collections.rateLimits().findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowSeconds * 1000) } },
    { upsert: true, returnDocument: "after" },
  );
  return { allowed: doc.count <= limit, retryAfter: Math.ceil((windowStart + windowSeconds * 1000 - now) / 1000) };
};

export const retryAfterText = (retryAfter) => (retryAfter >= 60 ? `${Math.ceil(retryAfter / 60)} min` : `${retryAfter}s`);

export const tooManyAttempts = (retryAfter) => ({
  ok: false,
  formError: `Too many attempts. Try again in ${retryAfterText(retryAfter)}.`,
});

export const rateLimitedResponse = (retryAfter) =>
  Response.json(
    { error: `Too many requests. Try again in ${retryAfterText(retryAfter)}.`, retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
