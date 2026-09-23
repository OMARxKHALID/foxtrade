import { ObjectId } from "mongodb";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { collections } from "@/lib/mongo";
import { LIVE, PRACTICE, getBalance, postEntries } from "@/lib/ledger";
import { transformCandles } from "@/lib/market/overlay";
import { placeTimedOrder, settleUser } from "./trading-engine";

vi.mock("@/lib/market/binance-rest", () => ({
  fetchLatestPrices: vi.fn(),
  fetchKlineRange: vi.fn(),
  fetchTickers: vi.fn(() => Promise.resolve([])),
  fetchKlines: vi.fn(() => Promise.resolve([])),
}));

const { fetchLatestPrices, fetchKlineRange } = await import("@/lib/market/binance-rest");

const SECOND = 1000;
const userId = "ab1cab1cab1cab1cab1cab1c";

beforeEach(async () => {
  for (const collection of Object.values(collections)) await collection().deleteMany({});
  vi.clearAllMocks();
  await collections.users().insertOne({ _id: new ObjectId(userId), email: "forced@test.dev", forceWin: true });
});

const fund = (mode) => postEntries([{ userId, mode, wallet: "timed", asset: "USDT", type: "faucet", amount: 10000 }], null);

describe("Practice and live funds never mix", () => {
  it("keeps a balance per mode under the same wallet and asset", async () => {
    await fund(PRACTICE);
    await postEntries([{ userId, mode: LIVE, wallet: "timed", asset: "USDT", type: "faucet", amount: 25 }], null);

    expect(Number(await getBalance(userId, "timed", "USDT", null, PRACTICE))).toBe(10000);
    expect(Number(await getBalance(userId, "timed", "USDT", null, LIVE))).toBe(25);
  });

  it("will not spend live funds to cover a practice debit", async () => {
    await postEntries([{ userId, mode: LIVE, wallet: "timed", asset: "USDT", type: "faucet", amount: 500 }], null);

    await expect(postEntries([{ userId, mode: PRACTICE, wallet: "timed", asset: "USDT", type: "timed_stake", amount: -100 }], null)).rejects.toThrow(
      /Insufficient/,
    );
    expect(Number(await getBalance(userId, "timed", "USDT", null, LIVE))).toBe(500);
  });

  it("rejects an unknown mode rather than inventing a wallet", async () => {
    await expect(postEntries([{ userId, mode: "bonus", wallet: "timed", asset: "USDT", type: "faucet", amount: 10 }], null)).rejects.toThrow(
      "Unknown wallet mode.",
    );
  });
});

describe("Force win cannot reach live money", () => {
  it("stamps forcedWin on a practice order but never on a live one", async () => {
    await fund(PRACTICE);
    await postEntries([{ userId, mode: LIVE, wallet: "timed", asset: "USDT", type: "faucet", amount: 10000 }], null);
    fetchLatestPrices.mockResolvedValue({ BTCUSDT: "65000" });
    const order = { symbol: "BTCUSDT", direction: "call", duration: 30, amount: 100 };

    const practiceId = await placeTimedOrder(userId, order, PRACTICE);
    const liveId = await placeTimedOrder(userId, order, LIVE);

    expect((await collections.orders().findOne({ _id: new ObjectId(practiceId) })).forcedWin).toBe(true);
    expect((await collections.orders().findOne({ _id: new ObjectId(liveId) })).forcedWin).toBe(false);
  });

  it("settles a live order on the real close price even while force win is on", async () => {
    await postEntries([{ userId, mode: LIVE, wallet: "timed", asset: "USDT", type: "faucet", amount: 10000 }], null);
    const expiresAt = new Date(Math.floor((Date.now() - 5000) / SECOND) * SECOND);
    await collections.orders().insertOne({
      userId,
      mode: LIVE,
      symbol: "BTCUSDT",
      direction: "call",
      duration: 30,
      amount: 100,
      payoutRate: 0.8,
      openPrice: 65000,
      openedAt: new Date(expiresAt.getTime() - 30 * SECOND),
      expiresAt,
      forcedWin: false,
      status: "open",
    });
    fetchKlineRange.mockResolvedValue([{ openTime: expiresAt.getTime(), close: 64000 }]);

    await settleUser(userId);

    const settled = await collections.orders().findOne({ userId, status: { $ne: "open" } });
    expect(settled.status).toBe("lost");
    expect(settled.closePrice).toBe(64000);
  });

  it("refuses to settle a live order that somehow carries the forced flag", async () => {
    const expiresAt = new Date(Math.floor((Date.now() - 5000) / SECOND) * SECOND);
    await collections.orders().insertOne({
      userId,
      mode: LIVE,
      symbol: "BTCUSDT",
      direction: "call",
      duration: 30,
      amount: 100,
      payoutRate: 0.8,
      openPrice: 65000,
      openedAt: new Date(expiresAt.getTime() - 30 * SECOND),
      expiresAt,
      forcedWin: true,
      status: "open",
    });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    await settleUser(userId);

    expect(await collections.orders().findOne({ userId, status: "open" })).not.toBeNull();
    expect(await collections.ledger().countDocuments({ userId, type: "timed_payout" })).toBe(0);
    logged.mockRestore();
  });
});

describe("Live charts are never steered", () => {
  it("leaves candles untouched when the forced trade is a live one", async () => {
    const openedAt = new Date(Date.now() - 20 * SECOND);
    await collections.orders().insertOne({
      userId,
      mode: LIVE,
      symbol: "BTCUSDT",
      direction: "call",
      amount: 100,
      payoutRate: 0.8,
      openPrice: 65000,
      openedAt,
      expiresAt: new Date(openedAt.getTime() + 60 * SECOND),
      forcedWin: true,
      status: "open",
    });
    const candles = [{ openTime: openedAt.getTime() + 5 * SECOND, open: 65000, high: 65100, low: 64900, close: 65000 }];

    expect(await transformCandles(userId, "BTCUSDT", candles, 5 * SECOND)).toEqual(candles);
  });
});
