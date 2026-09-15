import "server-only";
import { cacheLife, cacheTag, updateTag } from "next/cache";
import { collections } from "@/lib/mongo";
import { allSymbols } from "@/lib/market/pairs";
import { perpetualRules } from "@/lib/market/trading-rules";

const defaultPairSetting = { timedEnabled: true, perpetualEnabled: true, maxLeverage: perpetualRules.maxLeverage };

export const getPairSettings = async () => {
  "use cache";
  cacheTag("pair-settings");
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const defaults = Object.fromEntries(allSymbols.map((symbol) => [symbol, { ...defaultPairSetting }]));
  if (!process.env.MONGODB_URI) return defaults;
  const docs = await collections.pairSettings().find({ symbol: { $in: allSymbols } }).toArray();
  docs.forEach((doc) => {
    defaults[doc.symbol] = {
      timedEnabled: doc.timedEnabled !== false,
      perpetualEnabled: doc.perpetualEnabled !== false,
      maxLeverage: Math.min(perpetualRules.maxLeverage, Math.max(1, doc.maxLeverage ?? perpetualRules.maxLeverage)),
    };
  });
  return defaults;
};

export const getPairSetting = async (symbol) => (await getPairSettings())[symbol] ?? { ...defaultPairSetting };

export const savePairSetting = async (symbol, setting) => {
  const result = await collections
    .pairSettings()
    .findOneAndUpdate({ symbol }, { $set: { ...setting, symbol, updatedAt: new Date() } }, { upsert: true, returnDocument: "after" });
  updateTag("pair-settings");
  return result;
};
