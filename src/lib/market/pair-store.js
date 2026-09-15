import { readSetting, writeSetting } from "@/lib/settings-store";
import { defaultPairs, toPair } from "@/lib/market/pairs";

const normalizePair = (pair) =>
  toPair({
    base: String(pair.base).toUpperCase(),
    name: String(pair.name || pair.base).slice(0, 40),
    color: /^#[0-9a-f]{6}$/i.test(pair.color) ? pair.color : "#6b7280",
    timedEnabled: pair.timedEnabled !== false,
    perpetualEnabled: pair.perpetualEnabled !== false,
    maxLeverage: Math.min(500, Math.max(1, Math.round(Number(pair.maxLeverage) || 100))),
    featured: Boolean(pair.featured),
  });

export const readPairs = async () => {
  const stored = await readSetting("pairs");
  return Array.isArray(stored) && stored.length ? stored.map(normalizePair) : defaultPairs;
};

export const writePairs = async (pairs) => writeSetting("pairs", pairs.map(normalizePair));
