import "server-only";
import { createHash } from "node:crypto";
import { collections } from "@/lib/mongo";

const RETENTION_DAYS = 30;
const MESSAGE_LIMIT = 500;
const STACK_LIMIT = 2000;

let indexesReady;

const ensureIndexes = () => {
  indexesReady ??= Promise.all([
    collections.errors().createIndex({ fingerprint: 1 }, { unique: true }),
    collections.errors().createIndex({ lastSeenAt: -1 }),
    collections.errors().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  return indexesReady;
};

// Ids, hashes and numbers differ on every occurrence of the same bug, so they
// are stripped before hashing. Otherwise one broken code path looks like a
// thousand unrelated errors.
const fingerprintOf = (name, message, stack) => {
  const normalized = `${name}:${message}`
    .replace(/[0-9a-f]{24,}/gi, "<id>")
    .replace(/\d+/g, "<n>")
    .slice(0, MESSAGE_LIMIT);
  const frame = String(stack ?? "").split("\n")[1]?.trim() ?? "";
  return createHash("sha1").update(`${normalized}|${frame}`).digest("hex").slice(0, 16);
};

export const reportError = async (error, context = {}) => {
  // The console stays the source of truth for local work; the collection is
  // what you read when a user hit something you cannot reproduce.
  console.error(error);
  try {
    await ensureIndexes();
    const name = error?.name ?? "Error";
    const message = String(error?.message ?? error ?? "Unknown error").slice(0, MESSAGE_LIMIT);
    const stack = String(error?.stack ?? "").slice(0, STACK_LIMIT);
    const now = new Date();
    await collections.errors().updateOne(
      { fingerprint: fingerprintOf(name, message, stack) },
      {
        $set: { name, message, stack, lastSeenAt: now, lastContext: context, expiresAt: new Date(now.getTime() + RETENTION_DAYS * 86400000) },
        $inc: { count: 1 },
        $setOnInsert: { firstSeenAt: now },
      },
      { upsert: true },
    );
  } catch (loggingError) {
    // Logging must never be the reason a request fails.
    console.error("Could not record error:", loggingError);
  }
};

export const listErrors = async (limit = 100) => {
  const docs = await collections.errors().find().sort({ lastSeenAt: -1 }).limit(limit).toArray();
  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    message: doc.message,
    stack: doc.stack ?? "",
    count: doc.count ?? 1,
    context: doc.lastContext ?? {},
    firstSeenAt: doc.firstSeenAt?.toISOString() ?? null,
    lastSeenAt: doc.lastSeenAt?.toISOString() ?? null,
  }));
};

export const clearErrors = async () => {
  const { deletedCount } = await collections.errors().deleteMany({});
  return deletedCount;
};
