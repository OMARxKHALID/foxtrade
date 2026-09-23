export const priceDecimals = (value) => {
  const abs = Math.abs(value);
  if (abs >= 1000) return 2;
  if (abs >= 1) return 4;
  if (abs >= 0.01) return 5;
  return 8;
};

export const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  const decimals = priceDecimals(number);
  return number.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatUsdt = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatQuantity = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
};

export const formatAmount = (value, asset) => (asset === "USDT" ? formatUsdt(value) : formatQuantity(value));

export const formatPercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
};

export const formatCompact = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
};

export const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, name.length - 2)))}@${domain ?? ""}`;
};

// One set of date formats for the whole app. Locale differences were drifting
// between pages, so "en" is the default and en-GB is kept only where a 24 hour
// clock is deliberate.
export const dayMonth = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

export const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

export const longDate = new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" });

export const shortDateTime = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const fullDateTime = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const clockTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

export const dateTimeSeconds = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
