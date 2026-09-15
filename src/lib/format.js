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
