import { ObjectId } from "mongodb";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { collections } from "@/lib/mongo";
import { toBig } from "@/lib/money";
import { writePairs } from "@/lib/market/pair-store";
import { defaultPairs } from "@/lib/market/pairs";
import { defaultPlatformSettings, writePlatformSettings } from "@/lib/platform-settings";
import { getInvite, listInvited, recordSignup } from "@/lib/referrals";
import { convertAssets, claimFaucet, getAssetsOverview, listRecords, transferAssets } from "@/features/assets/dal/assets-dal";
import {
  addMargin,
  cancelPendingOrder,
  closePosition,
  getTradingSnapshot,
  placePerpetualOrder,
  placeTimedOrder,
  settleUser,
} from "@/features/trading/dal/trading-engine";

vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {}, updateTag: () => {} }));
vi.mock("@/lib/market/binance-rest", () => ({
  fetchLatestPrices: vi.fn(),
  fetchKlineRange: vi.fn(),
  fetchTickers: vi.fn(() => Promise.resolve([])),
  fetchKlines: vi.fn(() => Promise.resolve([])),
}));

const { fetchLatestPrices, fetchKlineRange } = await import("@/lib/market/binance-rest");

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const friend = { id: "u-journey-friend", email: "friend@example.com" };
const trader = { id: "u-journey-trader", email: "newtrader@example.com" };

const wallet = async (name, asset = "USDT") =>
  Number((await collections.wallets().findOne({ userId: trader.id, wallet: name, asset }))?.balance ?? 0);

const price = (value) => fetchLatestPrices.mockResolvedValue({ BTCUSDT: String(value), ETHUSDT: "3000" });

beforeAll(async () => {
  for (const collection of Object.values(collections)) await collection().deleteMany({});
  await writePairs(defaultPairs);
  await writePlatformSettings(defaultPlatformSettings);
});

describe("A new trader's first session", () => {
  it("signs up through a friend's invite link", async () => {
    const invite = await getInvite(friend.id, friend.email);
    await recordSignup({ userId: trader.id, email: trader.email, code: invite.code });
    const invited = await listInvited(friend.id);
    expect(invited).toHaveLength(1);
    expect(invited[0].email).toBe("ne••••••@example.com");
  });

  it("claims the practice balance and sees it in the spot wallet", async () => {
    await claimFaucet(trader.id);
    const overview = await getAssetsOverview(trader.id);
    expect(overview.totalUsdt).toBe(defaultPlatformSettings.demoAmount);
    expect(await wallet("spot")).toBe(100000);
  });

  it("moves money into the trading wallets", async () => {
    await transferAssets(trader.id, { from: "spot", to: "timed", asset: "USDT", amount: "1000" });
    await transferAssets(trader.id, { from: "spot", to: "perpetual", asset: "USDT", amount: "5000" });
    expect(await wallet("spot")).toBe(94000);
    expect(await wallet("timed")).toBe(1000);
    expect(await wallet("perpetual")).toBe(5000);
  });

  it("wins a 30-second timed trade", async () => {
    price(65000);
    const orderId = await placeTimedOrder(trader.id, { symbol: "BTCUSDT", direction: "call", duration: 30, amount: 100 });
    expect(await wallet("timed")).toBe(900);

    const expiresAt = new Date(Math.floor((Date.now() - 5 * SECOND) / SECOND) * SECOND);
    await collections.orders().updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { openedAt: new Date(expiresAt.getTime() - 30 * SECOND), expiresAt } },
    );
    fetchKlineRange.mockResolvedValue([{ openTime: expiresAt.getTime(), close: 66000 }]);
    await settleUser(trader.id);

    const order = await collections.orders().findOne({ _id: new ObjectId(orderId) });
    expect(order.status).toBe("won");
    expect(order.payout).toBe(180);
    expect(await wallet("timed")).toBe(1080);
  });

  it("opens a 10x long and closes it in profit", async () => {
    price(65000);
    fetchKlineRange.mockResolvedValue([]);
    const before = await wallet("perpetual");
    const positionId = await placePerpetualOrder(trader.id, {
      symbol: "BTCUSDT",
      side: "long",
      type: "market",
      amount: 500,
      leverage: 10,
      takeProfit: 70000,
      stopLoss: 60000,
    });
    const opened = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(opened.status).toBe("open");
    expect(opened.liquidationPrice).toBeLessThan(opened.entryPrice);
    expect(await wallet("perpetual")).toBeLessThan(before - 500);

    price(68000);
    await closePosition(trader.id, positionId);
    const closed = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(closed.status).toBe("closed");
    expect(closed.pnl).toBeGreaterThan(0);
    expect(await wallet("perpetual")).toBeGreaterThan(before);
  });

  it("adds margin to a losing position to push the liquidation price away", async () => {
    price(65000);
    fetchKlineRange.mockResolvedValue([]);
    const positionId = await placePerpetualOrder(trader.id, { symbol: "BTCUSDT", side: "long", type: "market", amount: 200, leverage: 20 });
    const before = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    await addMargin(trader.id, positionId, 300);
    const after = await collections.positions().findOne({ _id: new ObjectId(positionId) });
    expect(after.margin).toBe(500);
    expect(after.liquidationPrice).toBeLessThan(before.liquidationPrice);
  });

  it("is liquidated when the market crashes", async () => {
    const position = await collections.positions().findOne({ userId: trader.id, status: "open" });
    const checkedFrom = Math.floor((Date.now() - 3 * MINUTE) / MINUTE) * MINUTE;
    await collections.positions().updateOne({ _id: position._id }, { $set: { lastCheckedAt: new Date(checkedFrom) } });
    fetchKlineRange.mockImplementation(async ({ startTime }) => [
      { openTime: startTime, open: 65000, high: 65000, low: position.liquidationPrice - 500, close: 60000 },
    ]);
    await settleUser(trader.id);
    const closed = await collections.positions().findOne({ _id: position._id });
    expect(closed.status).toBe("liquidated");
    expect(closed.payout).toBe(0);
  });

  it("places a limit order and cancels it for a full refund", async () => {
    price(65000);
    fetchKlineRange.mockResolvedValue([]);
    const before = await wallet("perpetual");
    const positionId = await placePerpetualOrder(trader.id, { symbol: "BTCUSDT", side: "long", type: "limit", price: 60000, amount: 300, leverage: 5 });
    expect((await collections.positions().findOne({ _id: new ObjectId(positionId) })).status).toBe("pending");
    expect(await wallet("perpetual")).toBeLessThan(before);
    await cancelPendingOrder(trader.id, positionId);
    expect((await collections.positions().findOne({ _id: new ObjectId(positionId) })).status).toBe("cancelled");
    expect(await wallet("perpetual")).toBe(before);
  });

  it("converts USDT into BTC at the live rate", async () => {
    price(65000);
    const spotBefore = await wallet("spot");
    await convertAssets(trader.id, { from: "USDT", to: "BTC", amount: "6500" });
    expect(await wallet("spot")).toBe(spotBefore - 6500);
    expect(await wallet("spot", "BTC")).toBe(0.0999);
  });

  it("shows a complete transaction history and a consistent trading snapshot", async () => {
    const records = await listRecords(trader.id);
    const types = new Set(records.map((record) => record.type));
    expect(types).toContain("faucet");
    expect(types).toContain("transfer");
    expect(types).toContain("timed_stake");
    expect(types).toContain("timed_payout");
    expect(types).toContain("perp_margin");
    expect(types).toContain("perp_close");
    expect(types).toContain("convert");
    const snapshot = await getTradingSnapshot(trader.id, "perpetual");
    expect(Number(snapshot.available)).toBe(await wallet("perpetual"));
  });

  it("leaves every wallet exactly equal to the sum of its ledger rows", async () => {
    const wallets = await collections.wallets().find({ userId: trader.id }).toArray();
    expect(wallets.length).toBeGreaterThan(0);
    for (const row of wallets) {
      const entries = await collections.ledger().find({ userId: trader.id, wallet: row.wallet, asset: row.asset }).toArray();
      const total = entries.reduce((sum, entry) => sum.plus(toBig(entry.amount)), toBig(0));
      expect(total.toFixed()).toBe(toBig(row.balance).toFixed());
    }
  });
});
