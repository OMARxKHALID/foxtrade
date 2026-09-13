const REST_BASE = "https://data-api.binance.vision/api/v3";
const REQUEST_TIMEOUT_MS = 8000;

const marketFetchOptions = typeof window === "undefined" ? { next: { revalidate: 5 } } : { cache: "no-store" };

const fetchJson = async (path, options) => {
  const url = `${REST_BASE}${path}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response;
    try {
      response = await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      if (attempt === 0 && error?.name === "TimeoutError") continue;
      throw error;
    }
    if (response.ok) {
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error(`Binance ${path} returned an unexpected shape`);
      return data;
    }
    if (attempt === 0 && (response.status === 429 || response.status >= 500)) {
      await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 500));
      continue;
    }
    throw new Error(`Binance ${path} failed: ${response.status}`);
  }
};

const normalizeTicker = ({ symbol, lastPrice, openPrice, highPrice, lowPrice, volume, quoteVolume, priceChangePercent }) => ({
  symbol,
  price: Number(lastPrice),
  open: Number(openPrice),
  high: Number(highPrice),
  low: Number(lowPrice),
  volume: Number(volume),
  quoteVolume: Number(quoteVolume),
  changePercent: Number(priceChangePercent),
});

const normalizeKline = ([openTime, open, high, low, close, volume]) => ({
  time: Math.floor(openTime / 1000),
  open: Number(open),
  high: Number(high),
  low: Number(low),
  close: Number(close),
  volume: Number(volume),
});

export const fetchTickers = async (symbols) => {
  const params = new URLSearchParams({ symbols: JSON.stringify(symbols), type: "FULL" });
  const data = await fetchJson(`/ticker/24hr?${params}`, marketFetchOptions);
  return data.map(normalizeTicker);
};

export const fetchKlines = async ({ symbol, interval, limit = 500, endTime }) => {
  const params = new URLSearchParams({ symbol, interval, limit: String(limit) });
  if (endTime) params.set("endTime", String(endTime));
  const data = await fetchJson(`/klines?${params}`, marketFetchOptions);
  return data.map(normalizeKline);
};

export const fetchLatestPrices = async (symbols) => {
  const params = new URLSearchParams({ symbols: JSON.stringify(symbols) });
  const data = await fetchJson(`/ticker/price?${params}`, { cache: "no-store" });
  return Object.fromEntries(data.map((item) => [item.symbol, item.price]));
};

export const fetchKlineRange = async ({ symbol, interval, startTime, endTime, limit = 1000 }) => {
  const params = new URLSearchParams({ symbol, interval, startTime: String(startTime), limit: String(limit) });
  if (endTime) params.set("endTime", String(endTime));
  const data = await fetchJson(`/klines?${params}`, { cache: "no-store" });
  return data.map(([openTime, open, high, low, close]) => ({ openTime, open: Number(open), high: Number(high), low: Number(low), close: Number(close) }));
};
