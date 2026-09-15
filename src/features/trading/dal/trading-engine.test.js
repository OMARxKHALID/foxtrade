import { ObjectId } from "mongodb";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { collections } from "@/lib/mongo";
import { postEntries } from "@/lib/ledger";
import { settleUser, placePerpetualOrder } from "./trading-engine";

vi.mock("@/lib/market/binance-rest", () => ({
  fetchLatestPrices: vi.fn(),
  fetchKlineRange: vi.fn(),
  fetchTickers: vi.fn(() => Promise.resolve([])),
  fetchKlines: vi.fn(() => Promise.resolve([])),
}));

vi.mock("next/cache", () => ({
  cacheTag: () => {},
  cacheLife: () => {},
  updateTag: () => {},
}));

const { fetchLatestPrices, fetchKlineRange } = await import("@/lib/market/binance-rest");

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const clearAll = async () => {
  const collectionsToClear = Object.values(collections);
  for (const collection of collectionsToClear) {
    await collection().deleteMany({});
  }
};

beforeEach(async () => {
  await clearAll();
  vi.clearAllMocks();
});

describe("Double-settle race", () => {
  it("only credits one payout for two concurrent settlements", async () => {
    const userId = "u-double";
    await postEntries([{ userId, wallet: "timed", asset: "USDT", type: "faucet", amount: 10000 }], null);
    const expiresAt = new Date(Math.floor((Date.now() - 5000) / SECOND) * SECOND);
    const orderId = new ObjectId();
    await collections.orders().insertOne({
      _id: orderId,
      userId,
      symbol: "BTCUSDT",
      direction: "call",
      duration: 30,
      amount: 100,
      payoutRate: 0.8,
      openPrice: 65000,
      openedAt: new Date(expiresAt.getTime() - 30 * SECOND),
      expiresAt,
      status: "open",
    });
    fetchKlineRange.mockResolvedValue([{ openTime: expiresAt.getTime(), close: 66000 }]);
    await Promise.all([settleUser(userId), settleUser(userId)]);
    const payouts = await collections.ledger().find({ userId, type: "timed_payout" }).toArray();
    expect(payouts).toHaveLength(1);
    const wallet = await collections.wallets().findOne({ userId, wallet: "timed" });
    expect(Number(wallet.balance)).toBe(10180);
  });
});

describe("Liquidation / SL / TP priority", () => {
  it("resolves liquidation when all three triggers fire in one candle", async () => {
    const userId = "u-liq";
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 1000 }], null);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const positionId = await placePerpetualOrder(userId, {
      symbol: "BTCUSDT",
      side: "long",
      type: "market",
      amount: 100,
      leverage: 10,
      takeProfit: 66000,
      stopLoss: 64000,
    });
    const checkedFrom = Math.floor((Date.now() - 3 * MINUTE) / MINUTE) * MINUTE;
    await collections.positions().updateOne({ _id: new ObjectId(positionId) }, { $set: { lastCheckedAt: new Date(checkedFrom) } });
    const position = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    const liqPrice = position.liquidationPrice;
    const lowPrice = Math.min(liqPrice, 63000, 50000) - 1000;
    const highPrice = Math.max(66000, liqPrice) + 1000;
    fetchKlineRange.mockImplementation(async ({ startTime }) => [{ openTime: startTime, open: 65000, high: highPrice, low: lowPrice, close: 65000 }]);
    await settleUser(userId);
    const closed = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(closed.status).toBe("liquidated");
    expect(closed.pnl).toBe(-100);
    expect(closed.payout).toBe(0);
  });
});

describe("Pre-open price data", () => {
  it("ignores price moves from before the position was opened", async () => {
    const userId = "u-pre-open";
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 1000 }], null);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const positionId = await placePerpetualOrder(userId, { symbol: "BTCUSDT", side: "long", type: "market", amount: 100, leverage: 10, takeProfit: 65400 });
    const openedAt = Math.floor((Date.now() - 3 * MINUTE) / MINUTE) * MINUTE + 30 * SECOND;
    await collections.positions().updateOne({ _id: new ObjectId(positionId) }, { $set: { openedAt: new Date(openedAt), lastCheckedAt: new Date(openedAt) } });
    fetchKlineRange.mockImplementation(async ({ interval, startTime, endTime }) => {
      if (interval === "1m") return [{ openTime: startTime, open: 65000, high: startTime < openedAt ? 65500 : 65100, low: 64900, close: 65000 }];
      const seconds = [];
      for (let time = startTime; time <= endTime; time += SECOND) seconds.push({ openTime: time, open: 65000, high: 65100, low: 64900, close: 65000 });
      return seconds;
    });
    await settleUser(userId);
    const position = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    const starts = fetchKlineRange.mock.calls.map(([args]) => args.startTime);
    expect(Math.min(...starts)).toBeGreaterThanOrEqual(openedAt - SECOND);
    expect(fetchKlineRange.mock.calls[0][0].interval).toBe("1s");
    expect(position.status).toBe("open");
    expect(position.lastCheckedAt.getTime()).toBeGreaterThan(openedAt);
  });
});

describe("Off-by-one openTime validation (H1)", () => {
  const insertExpiredOrder = async (userId, expiresAtOffsetMs) => {
    const expiresAt = new Date(Math.floor((Date.now() + expiresAtOffsetMs) / SECOND) * SECOND);
    await postEntries([{ userId, wallet: "timed", asset: "USDT", type: "faucet", amount: 10000 }], null);
    await collections.orders().insertOne({
      userId,
      symbol: "BTCUSDT",
      direction: "call",
      duration: 30,
      amount: 100,
      payoutRate: 0.8,
      openPrice: 65000,
      openedAt: new Date(expiresAt.getTime() - 30 * SECOND),
      expiresAt,
      status: "open",
    });
    return expiresAt;
  };

  it("does not settle when openTime mismatches and fallback is not due", async () => {
    const userId = "u-exact-early";
    const expiresAt = await insertExpiredOrder(userId, -3000);
    const wrongOpenTime = expiresAt.getTime() + 4000;
    fetchKlineRange.mockResolvedValue([{ openTime: wrongOpenTime, close: 66000 }]);
    await settleUser(userId);
    const order = await collections.orders().findOne({ userId, status: "open" });
    expect(order).not.toBeNull();
  });

  it("settles via fallback close when openTime mismatches and 5 min have passed", async () => {
    const userId = "u-exact-fallback";
    const expiresAt = await insertExpiredOrder(userId, -6 * 60_000);
    const wrongOpenTime = expiresAt.getTime() + 4000;
    fetchKlineRange.mockResolvedValue([{ openTime: wrongOpenTime, close: 66000 }]);
    await settleUser(userId);
    const order = await collections.orders().findOne({ userId, status: "won" });
    expect(order).not.toBeNull();
    expect(order.closePrice).toBe(66000);
  });

  it("falls back to latest price when no kline is returned at all after fallback window", async () => {
    const userId = "u-no-kline-fallback";
    await insertExpiredOrder(userId, -6 * 60_000);
    fetchKlineRange.mockResolvedValue([]);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65500" });
    await settleUser(userId);
    const order = await collections.orders().findOne({ userId, status: "won" });
    expect(order).not.toBeNull();
    expect(order.closePrice).toBe(65500);
  });
});
