import { ObjectId } from "mongodb";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { collections } from "@/lib/mongo";
import { postEntries } from "@/lib/ledger";
import { writePairs } from "@/lib/market/pair-store";
import { defaultPairs } from "@/lib/market/pairs";
import { defaultPlatformSettings, writePlatformSettings } from "@/lib/platform-settings";
import { addMargin, cancelPendingOrder, closePosition, settleUser, placePerpetualOrder, placeTimedOrder } from "./trading-engine";

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

const placeBackdatedLimitLong = async (userId, extra = {}) => {
  await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 1000 }], null);
  fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
  const positionId = await placePerpetualOrder(userId, { symbol: "BTCUSDT", side: "long", type: "limit", price: 64000, amount: 100, leverage: 10, ...extra });
  const createdAt = new Date(Math.floor((Date.now() - 3 * MINUTE) / MINUTE) * MINUTE);
  await collections.positions().updateOne({ _id: new ObjectId(positionId) }, { $set: { createdAt, lastCheckedAt: createdAt } });
  const position = await collections.positions().findOne({ _id: new ObjectId(positionId) });
  const wallet = await collections.wallets().findOne({ userId, wallet: "perpetual" });
  return { positionId, position, balanceAfterPlace: Number(wallet.balance) };
};

describe("Cancel pending order after unseen fill + liquidation", () => {
  it("liquidates instead of refunding when replay shows the order filled and crossed liquidation", async () => {
    const userId = "u-cancel-liq";
    const { positionId, position, balanceAfterPlace } = await placeBackdatedLimitLong(userId);
    const start = position.createdAt.getTime();
    const crash = position.liquidationPrice - 1000;
    fetchKlineRange.mockImplementation(async () => [
      { openTime: start, open: 64500, high: 64500, low: 63900, close: 64100 },
      { openTime: start + MINUTE, open: 64100, high: 64100, low: crash, close: crash },
    ]);
    await expect(cancelPendingOrder(userId, positionId)).rejects.toThrow("Order not found or already filled.");
    const closed = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(closed.status).toBe("liquidated");
    const wallet = await collections.wallets().findOne({ userId, wallet: "perpetual" });
    expect(Number(wallet.balance)).toBe(balanceAfterPlace);
    expect(await collections.ledger().countDocuments({ userId, note: "Order cancelled" })).toBe(0);
  });

  it("keeps the order pending with a clear error when market data is unavailable", async () => {
    const userId = "u-cancel-outage";
    const { positionId, balanceAfterPlace } = await placeBackdatedLimitLong(userId);
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchKlineRange.mockRejectedValue(new Error("Binance request failed: 503"));
    await expect(cancelPendingOrder(userId, positionId)).rejects.toThrow("Market data is unavailable");
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("Could not replay pending order"), expect.any(Error));
    logged.mockRestore();
    const order = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(order.status).toBe("pending");
    const wallet = await collections.wallets().findOne({ userId, wallet: "perpetual" });
    expect(Number(wallet.balance)).toBe(balanceAfterPlace);
  });
});

describe("Trigger on the fill candle", () => {
  it("liquidates on the same candle that fills the limit order", async () => {
    const userId = "u-fill-liq";
    const { positionId, position } = await placeBackdatedLimitLong(userId);
    const start = position.createdAt.getTime();
    fetchKlineRange.mockImplementation(async () => [{ openTime: start, open: 64500, high: 64500, low: position.liquidationPrice - 1000, close: 60000 }]);
    await settleUser(userId);
    const closed = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(closed.status).toBe("liquidated");
    expect(closed.closeReason).toBe("liquidation");
  });

  it("does not take profit on the fill candle since the high may predate the fill", async () => {
    const userId = "u-fill-tp";
    const { positionId, position } = await placeBackdatedLimitLong(userId, { takeProfit: 64600 });
    const start = position.createdAt.getTime();
    fetchKlineRange.mockImplementation(async () => [{ openTime: start, open: 64500, high: 64700, low: 63900, close: 64100 }]);
    await settleUser(userId);
    const current = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(current.status).toBe("open");
  });
});

describe("Take profit before the fill on a retried replay", () => {
  it("ignores pre-fill highs when an already-filled position is replayed from before its fill", async () => {
    const userId = "u-retry-tp";
    const { positionId, position } = await placeBackdatedLimitLong(userId, { takeProfit: 64600 });
    const start = position.createdAt.getTime();
    await collections.positions().updateOne({ _id: new ObjectId(positionId) }, { $set: { status: "open", openedAt: new Date(start + MINUTE) } });
    fetchKlineRange.mockImplementation(async () => [
      { openTime: start, open: 64500, high: 64700, low: 64100, close: 64200 },
      { openTime: start + MINUTE, open: 64200, high: 64500, low: 63900, close: 64100 },
    ]);
    await settleUser(userId);
    const current = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(current.status).toBe("open");
  });
});

describe("Close racing an add-margin", () => {
  it("refuses to close with a stale margin so the added margin is not lost", async () => {
    const userId = "u-close-margin";
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 1000 }], null);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const positionId = await placePerpetualOrder(userId, { symbol: "BTCUSDT", side: "long", type: "market", amount: 100, leverage: 10 });
    fetchKlineRange.mockResolvedValue([]);
    fetchLatestPrices.mockImplementationOnce(async () => {
      await addMargin(userId, positionId, 50);
      return { BTCUSDT: "65000" };
    });
    await expect(closePosition(userId, positionId)).rejects.toThrow(/just changed/);
    const position = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(position.status).toBe("open");
    expect(position.margin).toBe(150);
    await closePosition(userId, positionId);
    const closed = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(closed.status).toBe("closed");
    expect(closed.payout).toBeGreaterThan(140);
  });
});

describe("Leverage at or above 1 / maintenance margin", () => {
  it("rejects leverage that would put liquidation at or past entry", async () => {
    const userId = "u-max-leverage";
    await writePlatformSettings({ ...defaultPlatformSettings, maxLeverage: 500, maintenanceMarginRate: 0.005 });
    await writePairs(defaultPairs.map((pair) => ({ ...pair, maxLeverage: 500 })));
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 1000 }], null);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const order = { symbol: "BTCUSDT", side: "long", type: "market", amount: 10 };
    await expect(placePerpetualOrder(userId, { ...order, leverage: 200 })).rejects.toThrow(/below 200x/);
    const positionId = await placePerpetualOrder(userId, { ...order, leverage: 199 });
    const position = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(position.liquidationPrice).toBeLessThan(position.entryPrice);
  });
});

describe("Active position cap", () => {
  it("rejects new orders once a user has 50 open or pending positions", async () => {
    const userId = "u-position-cap";
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 1000 }], null);
    const now = new Date();
    await collections.positions().insertMany(
      Array.from({ length: 50 }, (_, index) => ({ userId, symbol: "BTCUSDT", status: index % 2 ? "open" : "pending", createdAt: now, lastCheckedAt: now })),
    );
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const order = { symbol: "BTCUSDT", side: "long", type: "market", amount: 10, leverage: 5 };
    await expect(placePerpetualOrder(userId, order)).rejects.toThrow("up to 50 open positions");
    const wallet = await collections.wallets().findOne({ userId, wallet: "perpetual" });
    expect(Number(wallet.balance)).toBe(1000);
    await collections.positions().updateOne({ userId, status: "pending" }, { $set: { status: "cancelled" } });
    await expect(placePerpetualOrder(userId, order)).resolves.toEqual(expect.any(String));
  });

  it("never lets concurrent placements exceed the cap", async () => {
    const userId = "u-position-cap-race";
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 100000 }], null);
    await collections.positionCounters().insertOne({ _id: userId, count: 48 });
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const order = { symbol: "BTCUSDT", side: "long", type: "market", amount: 10, leverage: 5 };
    const results = await Promise.allSettled(Array.from({ length: 5 }, () => placePerpetualOrder(userId, order)));
    const fulfilled = results.filter((result) => result.status === "fulfilled").length;
    expect(fulfilled).toBe(2);
    expect((await collections.positionCounters().findOne({ _id: userId })).count).toBe(50);
  });

  it("frees a slot when a position closes and reclaims it on the next order", async () => {
    const userId = "u-position-cap-release";
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 1000 }], null);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const order = { symbol: "BTCUSDT", side: "long", type: "market", amount: 10, leverage: 5 };
    const positionId = await placePerpetualOrder(userId, order);
    expect((await collections.positionCounters().findOne({ _id: userId })).count).toBe(1);
    fetchKlineRange.mockResolvedValue([]);
    await closePosition(userId, positionId);
    expect((await collections.positionCounters().findOne({ _id: userId })).count).toBe(0);
    await expect(placePerpetualOrder(userId, order)).resolves.toEqual(expect.any(String));
  });
});

describe("Settlement concurrency", () => {
  it("replays a user's positions in bounded batches", async () => {
    const userId = "u-batched-settle";
    const checkedFrom = new Date(Math.floor((Date.now() - 3 * MINUTE) / MINUTE) * MINUTE);
    await collections.positions().insertMany(
      Array.from({ length: 25 }, () => ({ userId, symbol: "BTCUSDT", side: "long", status: "pending", limitPrice: 1, createdAt: checkedFrom, lastCheckedAt: checkedFrom })),
    );
    let inFlight = 0;
    let peak = 0;
    fetchKlineRange.mockImplementation(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return [];
    });
    await settleUser(userId);
    expect(fetchKlineRange).toHaveBeenCalledTimes(25);
    expect(peak).toBeLessThanOrEqual(10);
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
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const expiresAt = await insertExpiredOrder(userId, -6 * 60_000);
    const wrongOpenTime = expiresAt.getTime() + 4000;
    fetchKlineRange.mockResolvedValue([{ openTime: wrongOpenTime, close: 66000 }]);
    await settleUser(userId);
    const order = await collections.orders().findOne({ userId, status: "won" });
    expect(order).not.toBeNull();
    expect(order.closePrice).toBe(66000);
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("Timed settlement fallback"));
    logged.mockRestore();
  });

  it("falls back to latest price when no kline is returned at all after fallback window", async () => {
    const userId = "u-no-kline-fallback";
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    await insertExpiredOrder(userId, -6 * 60_000);
    fetchKlineRange.mockResolvedValue([]);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65500" });
    await settleUser(userId);
    const order = await collections.orders().findOne({ userId, status: "won" });
    expect(order).not.toBeNull();
    expect(order.closePrice).toBe(65500);
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("Timed settlement fallback"));
    logged.mockRestore();
  });
});

describe("Force win", () => {
  const hexUserId = (seed) => seed.repeat(12);
  const insertUser = async (userId, forceWin) => {
    await collections.users().insertOne({ _id: new ObjectId(userId), email: `${userId}@test.dev`, forceWin });
  };

  const insertExpiredForcedOrder = async (userId, direction) => {
    const expiresAt = new Date(Math.floor((Date.now() - 5000) / SECOND) * SECOND);
    await postEntries([{ userId, wallet: "timed", asset: "USDT", type: "faucet", amount: 10000 }], null);
    await collections.orders().insertOne({
      userId,
      symbol: "BTCUSDT",
      direction,
      duration: 30,
      amount: 100,
      payoutRate: 0.8,
      openPrice: 65000,
      openedAt: new Date(expiresAt.getTime() - 30 * SECOND),
      expiresAt,
      forcedWin: true,
      status: "open",
    });
    return expiresAt;
  };

  it("settles a forced order as a win even when the market moved against it", async () => {
    const userId = "ab1cab1cab1cab1cab1cab1c";
    await insertExpiredForcedOrder(userId, "put");
    fetchKlineRange.mockResolvedValue([{ openTime: Date.now(), close: 66000 }]);
    await settleUser(userId);
    const order = await collections.orders().findOne({ userId, status: { $ne: "open" } });
    expect(order.status).toBe("won");
    expect(order.payout).toBe(180);
    expect(order.closePrice).toBeLessThan(65000);
    const wallet = await collections.wallets().findOne({ userId, wallet: "timed" });
    expect(Number(wallet.balance)).toBe(10180);
  });

  it("stamps forcedWin on new trades only while the user flag is on", async () => {
    const userId = "cd2dcd2dcd2dcd2dcd2dcd2d";
    await insertUser(userId, true);
    await postEntries([{ userId, wallet: "timed", asset: "USDT", type: "faucet", amount: 10000 }], null);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const orderId = await placeTimedOrder(userId, { symbol: "BTCUSDT", direction: "call", duration: 30, amount: 100 });
    const order = await collections.orders().findOne({ _id: new ObjectId(orderId) });
    expect(order.forcedWin).toBe(true);
    await collections.users().updateOne({ _id: new ObjectId(userId) }, { $set: { forceWin: false } });
    const secondId = await placeTimedOrder(userId, { symbol: "BTCUSDT", direction: "call", duration: 30, amount: 100 });
    const second = await collections.orders().findOne({ _id: new ObjectId(secondId) });
    expect(second.forcedWin).toBe(false);
  });

  it("never liquidates a forced perpetual position", async () => {
    const userId = "ef3fef3fef3fef3fef3fef3f";
    await insertUser(userId, true);
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 1000 }], null);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const positionId = await placePerpetualOrder(userId, { symbol: "BTCUSDT", side: "long", type: "market", amount: 100, leverage: 10, stopLoss: 64000 });
    const position = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(position.forcedWin).toBe(true);
    expect(position.stopLoss).toBe(64000);
    const checkedFrom = Math.floor((Date.now() - 3 * MINUTE) / MINUTE) * MINUTE;
    await collections.positions().updateOne({ _id: new ObjectId(positionId) }, { $set: { lastCheckedAt: new Date(checkedFrom) } });
    fetchKlineRange.mockImplementation(async ({ startTime }) => [{ openTime: startTime, open: 65000, high: 65100, low: position.liquidationPrice - 5000, close: position.liquidationPrice - 6000 }]);
    await settleUser(userId);
    const current = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(current.status).toBe("open");
  });

  it("never closes a forced position below its margin", async () => {
    const userId = "123412341234123412341234";
    await insertUser(userId, true);
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 1000 }], null);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const positionId = await placePerpetualOrder(userId, { symbol: "BTCUSDT", side: "long", type: "market", amount: 100, leverage: 10 });
    fetchKlineRange.mockResolvedValue([]);
    await closePosition(userId, positionId);
    const closed = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(closed.status).toBe("closed");
    expect(closed.payout).toBeGreaterThanOrEqual(100);
  });
});
