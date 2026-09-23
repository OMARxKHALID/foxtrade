import { ObjectId } from "mongodb";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { collections } from "@/lib/mongo";
import { LIVE, PRACTICE, getBalance, postEntries } from "@/lib/ledger";
import { writePairs } from "@/lib/market/pair-store";
import { defaultPairs } from "@/lib/market/pairs";
import { convertAssets, getAssetsOverview, submitWithdrawal, transferAssets } from "./assets-dal";

vi.mock("@/lib/pin", () => ({ verifyPin: vi.fn(async () => true) }));
vi.mock("@/lib/market/binance-rest", () => ({
  fetchLatestPrices: vi.fn(async () => ({ BTCUSDT: "50000" })),
  fetchTickers: vi.fn(async () => [{ symbol: "BTCUSDT", price: 50000 }]),
}));

const userId = new ObjectId().toString();

const fund = (mode, amount) => postEntries([{ userId, mode, wallet: "spot", asset: "USDT", type: "deposit", amount }], null);
const spot = async (mode, asset = "USDT") => Number(await getBalance(userId, "spot", asset, null, mode));

beforeEach(async () => {
  for (const collection of Object.values(collections)) await collection().deleteMany({});
  await writePairs(defaultPairs);
  await collections.verifications().insertOne({ userId, email: "t@test.dev", status: "approved", documents: { status: "approved" } });
});

describe("Balance surfaces show the account you are in", () => {
  it("reports live holdings for a live account and practice for a practice one", async () => {
    await fund(PRACTICE, 10000);
    await fund(LIVE, 250);

    expect(Number((await getAssetsOverview(userId, PRACTICE)).totalUsdt)).toBe(10000);
    expect(Number((await getAssetsOverview(userId, LIVE)).totalUsdt)).toBe(250);
  });
});

describe("Moving funds stays inside one account", () => {
  it("converts live funds without touching the practice balance", async () => {
    await fund(PRACTICE, 10000);
    await fund(LIVE, 1000);

    await convertAssets(userId, { from: "USDT", to: "BTC", amount: 500 }, LIVE);

    expect(await spot(LIVE)).toBe(500);
    expect(await spot(PRACTICE)).toBe(10000);
    expect(await spot(PRACTICE, "BTC")).toBe(0);
    expect(await spot(LIVE, "BTC")).toBeGreaterThan(0);
  });

  it("transfers live funds between wallets without touching practice", async () => {
    await fund(PRACTICE, 10000);
    await fund(LIVE, 1000);

    await transferAssets(userId, { from: "spot", to: "timed", asset: "USDT", amount: 400 }, LIVE);

    expect(await spot(LIVE)).toBe(600);
    expect(Number(await getBalance(userId, "timed", "USDT", null, LIVE))).toBe(400);
    expect(Number(await getBalance(userId, "timed", "USDT", null, PRACTICE))).toBe(0);
  });

});

describe("Withdrawals route by account", () => {
  const request = { asset: "USDT", amount: 100, pin: "123456", address: "0xabc", network: "ETH" };

  it("still refuses to send practice balances anywhere", async () => {
    await fund(PRACTICE, 1000);

    await expect(submitWithdrawal(userId, request, PRACTICE)).rejects.toThrow(/Practice balances cannot be sent/);
    expect(await collections.withdrawals().countDocuments({})).toBe(0);
  });

  it("queues a real withdrawal and holds the funds for a live account", async () => {
    await fund(LIVE, 1000);

    const { id } = await submitWithdrawal(userId, request, LIVE);

    expect(id).toEqual(expect.any(String));
    expect(await spot(LIVE)).toBe(900);
    expect((await collections.withdrawals().findOne({})).status).toBe("requested");
  });
});
