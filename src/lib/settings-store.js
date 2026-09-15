import { collections } from "@/lib/mongo";

const settingId = (key) => `setting:${key}`;

export const readSetting = async (key) => {
  if (!process.env.MONGODB_URI) return null;
  const doc = await collections.settings().findOne({ _id: settingId(key) });
  return doc?.value ?? null;
};

export const writeSetting = async (key, value) => {
  await collections.settings().updateOne({ _id: settingId(key) }, { $set: { value, updatedAt: new Date() } }, { upsert: true });
  return value;
};
