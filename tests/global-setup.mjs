import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet;

export const setup = async () => {
  process.env.BETTER_AUTH_SECRET ??= "test-secret-that-is-long-enough-123456";
  try {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
    process.env.MONGODB_URI = replSet.getUri("foxtrade-test");
  } catch {
    if (!process.env.MONGODB_URI) throw new Error("No MongoDB available for tests");
    process.env.MONGODB_URI = process.env.MONGODB_URI.replace(/\/[^/?]*(\?|$)/, "/foxtrade-test$1");
  }
};

export const teardown = async () => {
  if (replSet) await replSet.stop();
};
