import { describe, expect, it, vi, beforeEach } from "vitest";
import { collections } from "@/lib/mongo";
import { postEntries } from "@/lib/ledger";
import { claimFaucet, transferAssets } from "./assets-dal";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

vi.mock("@/lib/market/binance-rest", () => ({
  fetchLatestPrices: vi.fn(() => Promise.resolve({})),
  fetchTickers: vi.fn(() => Promise.resolve([])),
  fetchKlines: vi.fn(() => Promise.resolve([])),
  fetchKlineRange: vi.fn(() => Promise.resolve([])),
}));

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

describe("Insufficient-balance rollback", () => {
  it("does not mutate any wallet or ledger on failed transfer", async () => {
    const userId = "u-rollback";
    await postEntries([{ userId, wallet: "spot", asset: "USDT", type: "faucet", amount: 100 }], null);
    const before = await collections.wallets().findOne({ userId, wallet: "spot", asset: "USDT" });
    await expect(
      transferAssets(userId, { from: "timed", to: "spot", asset: "USDT", amount: 500 }),
    ).rejects.toThrow(/Insufficient/i);
    const after = await collections.wallets().findOne({ userId, wallet: "spot", asset: "USDT" });
    expect(after.balance.toString()).toBe(before.balance.toString());
    const transfers = await collections.ledger().find({ userId, type: "transfer" }).toArray();
    expect(transfers).toHaveLength(0);
  });
});

describe("Faucet cap invariant", () => {
  it("tops up total USDT to the cap, even with a concurrent transfer between wallets", async () => {
    const totals = await Promise.all(
      Array.from({ length: 20 }, async (_, i) => {
        const userId = `u-faucet-${i}`;
        await postEntries([{ userId, wallet: "spot", asset: "USDT", type: "faucet", amount: 40000 }], null);
        await postEntries([{ userId, wallet: "timed", asset: "USDT", type: "faucet", amount: 30000 }], null);
        await Promise.all([
          transferAssets(userId, { from: "timed", to: "spot", asset: "USDT", amount: 20000 }),
          claimFaucet(userId),
        ]);
        const wallets = await collections.wallets().find({ userId, asset: "USDT" }).toArray();
        return wallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);
      }),
    );
    totals.forEach((total) => expect(total).toBe(100000));
  });

  it("rejects a claim when USDT was moved out of spot into a trading wallet", async () => {
    const userId = "u-faucet-moved";
    await postEntries([{ userId, wallet: "perpetual", asset: "USDT", type: "faucet", amount: 100000 }], null);
    await expect(claimFaucet(userId)).rejects.toThrow(/full demo/i);
  });

  it("does not burn the cooldown when spot is already at the cap", async () => {
    const userId = "u-faucet-full";
    await postEntries([{ userId, wallet: "spot", asset: "USDT", type: "faucet", amount: 100000 }], null);
    await expect(claimFaucet(userId)).rejects.toThrow(/full demo/i);
    const security = await collections.security().findOne({ userId });
    expect(security?.faucetClaimedAt).toBeUndefined();
  });
});
