import { readSetting, writeSetting } from "@/lib/settings-store";

export const defaultPlatformSettings = {
  siteName: "Foxtrade",
  tagline: "Conquering Your Trading Goals",
  description: "Trade crypto with live Binance prices and practice balances.",
  supportEmail: "support@foxtrade.app",
  supportWhatsapp: "",
  maintenanceMode: false,
  maintenanceMessage: "We are carrying out scheduled maintenance. Trading will be back shortly.",
  demoAmount: 100000,
  convertSpread: 0.001,
  takerFeeRate: 0.0005,
  maintenanceMarginRate: 0.005,
  maxLeverage: 100,
  timedDurations: [
    { seconds: 30, payoutRate: 0.8, minAmount: 10 },
    { seconds: 60, payoutRate: 0.82, minAmount: 10 },
    { seconds: 120, payoutRate: 0.85, minAmount: 20 },
    { seconds: 300, payoutRate: 0.87, minAmount: 50 },
    { seconds: 900, payoutRate: 0.88, minAmount: 100 },
  ],
};

const number = (value, min, max, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const text = (value, fallback, max) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback);

const normalizeDurations = (durations) => {
  if (!Array.isArray(durations) || !durations.length) return defaultPlatformSettings.timedDurations;
  const unique = new Map();
  durations.forEach((item) => {
    const seconds = Math.round(number(item?.seconds, 5, 86400, 0));
    if (!seconds) return;
    unique.set(seconds, { seconds, payoutRate: number(item.payoutRate, 0.01, 5, 0.8), minAmount: number(item.minAmount, 1, 1e9, 10) });
  });
  return unique.size ? [...unique.values()].sort((a, b) => a.seconds - b.seconds) : defaultPlatformSettings.timedDurations;
};

export const normalizePlatformSettings = (value = {}) => {
  const base = defaultPlatformSettings;
  return {
    siteName: text(value.siteName, base.siteName, 40),
    tagline: text(value.tagline, base.tagline, 120),
    description: text(value.description, base.description, 300),
    supportEmail: text(value.supportEmail, base.supportEmail, 120),
    supportWhatsapp: typeof value.supportWhatsapp === "string" ? value.supportWhatsapp.replace(/[^\d]/g, "").slice(0, 15) : base.supportWhatsapp,
    maintenanceMode: Boolean(value.maintenanceMode),
    maintenanceMessage: text(value.maintenanceMessage, base.maintenanceMessage, 200),
    demoAmount: number(value.demoAmount, 0, 1e9, base.demoAmount),
    convertSpread: number(value.convertSpread, 0, 0.2, base.convertSpread),
    takerFeeRate: number(value.takerFeeRate, 0, 0.1, base.takerFeeRate),
    maintenanceMarginRate: number(value.maintenanceMarginRate, 0, 0.5, base.maintenanceMarginRate),
    maxLeverage: Math.round(number(value.maxLeverage, 1, 500, base.maxLeverage)),
    timedDurations: normalizeDurations(value.timedDurations),
  };
};

export const readPlatformSettings = async () => normalizePlatformSettings((await readSetting("platform")) ?? {});

export const writePlatformSettings = async (value) => writeSetting("platform", normalizePlatformSettings(value));
