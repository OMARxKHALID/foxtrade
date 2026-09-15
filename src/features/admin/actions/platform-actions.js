"use server";

import { updateTag } from "next/cache";
import { formFailure, validationFailure } from "@/lib/action-result";
import { settingsTags } from "@/lib/cached-settings";
import { contentByKey } from "@/lib/content/content-registry";
import { resetContent, writeContent } from "@/lib/content/page-content";
import { fetchTickers } from "@/lib/market/binance-rest";
import { readPairs, writePairs } from "@/lib/market/pair-store";
import { QUOTE } from "@/lib/market/pairs";
import { collections } from "@/lib/mongo";
import { writePlatformSettings } from "@/lib/platform-settings";
import { asAdmin, writeAudit } from "@/features/admin/dal/admin-dal";
import { contentKeySchema, contentSchema, pairSchema, pairSymbolSchema, platformSettingsSchema } from "@/features/admin/schemas/admin-schema";

const listedOnBinance = async (symbol) => {
  try {
    const [ticker] = await fetchTickers([symbol]);
    return ticker?.symbol === symbol && ticker.price > 0;
  } catch {
    return false;
  }
};

export const savePair = async (input) => {
  const parsed = pairSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const pair = parsed.data;
    const symbol = `${pair.base}${QUOTE}`;
    const pairs = await readPairs();
    const existing = pairs.find((item) => item.symbol === symbol);
    if (!existing && !(await listedOnBinance(symbol))) return formFailure(`${symbol} is not a live Binance spot pair.`);
    const next = existing ? pairs.map((item) => (item.symbol === symbol ? { ...item, ...pair } : item)) : [...pairs, pair];
    await writePairs(next);
    updateTag(settingsTags.pairs);
    await writeAudit(admin, existing ? "pair.update" : "pair.create", symbol, `Futures ${pair.perpetualEnabled ? "on" : "off"}, Options ${pair.timedEnabled ? "on" : "off"}, max ${pair.maxLeverage}x`);
  });
};

export const removePair = async (symbol) => {
  const parsed = pairSymbolSchema.safeParse(symbol);
  if (!parsed.success) return formFailure("Invalid pair.");
  return asAdmin(async (admin) => {
    const pairs = await readPairs();
    const pair = pairs.find((item) => item.symbol === parsed.data);
    if (!pair) return formFailure("Pair not found.");
    if (pairs.length === 1) return formFailure("Keep at least one trading pair.");
    const [openPositions, openOrders, holders] = await Promise.all([
      collections.positions().countDocuments({ symbol: pair.symbol, status: { $in: ["open", "pending"] } }),
      collections.orders().countDocuments({ symbol: pair.symbol, status: "open" }),
      collections.wallets().countDocuments({ asset: pair.base, balance: { $gt: 0 } }),
    ]);
    if (openPositions || openOrders) return formFailure(`${pair.symbol} still has open trades. Pause it instead and remove it once they close.`);
    if (holders) return formFailure(`${holders} wallet(s) still hold ${pair.base}. Pause the pair instead.`);
    await writePairs(pairs.filter((item) => item.symbol !== pair.symbol));
    updateTag(settingsTags.pairs);
    await writeAudit(admin, "pair.delete", pair.symbol);
  });
};

export const savePlatformSettings = async (input) => {
  const parsed = platformSettingsSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const { convertSpreadPercent, takerFeePercent, maintenanceMarginPercent, timedDurations, ...rest } = parsed.data;
    const saved = await writePlatformSettings({
      ...rest,
      convertSpread: convertSpreadPercent / 100,
      takerFeeRate: takerFeePercent / 100,
      maintenanceMarginRate: maintenanceMarginPercent / 100,
      timedDurations: timedDurations.map(({ seconds, payoutPercent, minAmount }) => ({ seconds, payoutRate: payoutPercent / 100, minAmount })),
    });
    updateTag(settingsTags.platform);
    await writeAudit(admin, "settings.update", saved.siteName, `Demo ${saved.demoAmount} USDT, fee ${saved.takerFeeRate * 100}%, max ${saved.maxLeverage}x`);
  });
};

export const saveContent = async (input) => {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  if (!contentByKey[parsed.data.key]) return formFailure("Unknown document.");
  return asAdmin(async (admin) => {
    const { key, ...content } = parsed.data;
    await writeContent(key, content);
    updateTag(settingsTags.content);
    await writeAudit(admin, "content.update", key, `${content.sections.length} section(s)`);
  });
};

export const restoreDefaultContent = async (key) => {
  const parsed = contentKeySchema.safeParse(key);
  if (!parsed.success || !contentByKey[parsed.data]) return formFailure("Unknown document.");
  return asAdmin(async (admin) => {
    await resetContent(parsed.data);
    updateTag(settingsTags.content);
    await writeAudit(admin, "content.reset", parsed.data);
  });
};
