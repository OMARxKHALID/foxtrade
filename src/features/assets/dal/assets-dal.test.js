import { describe, expect, it, vi, beforeEach } from "vitest";
import { collections } from "@/lib/mongo";
import { postEntries } from "@/lib/ledger";
import { toBig } from "@/lib/money";
import { setPin } from "@/lib/pin";
import { transferSchema, withdrawSchema } from "@/features/assets/schemas/assets-schema";
import { checkWithdrawal, claimFaucet, getAssetsOverview, transferAssets } from "./assets-dal";

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

describe("Full-precision amounts", () => {
  it("transfers a max balance above 1e7 exactly, with no dust left behind", async () => {
    const userId = "u-precision";
    const balance = "12345678.12345678";
    await postEntries([{ userId, wallet: "spot", asset: "USDT", type: "faucet", amount: balance }], null);
    const overview = await getAssetsOverview(userId);
    expect(overview.holdings.USDT.byWallet.spot).toBe(balance);
    const parsed = transferSchema.parse({ from: "spot", to: "perpetual", asset: "USDT", amount: overview.holdings.USDT.byWallet.spot });
    expect(parsed.amount).toBe(balance);
    await transferAssets(userId, parsed);
    const spot = await collections.wallets().findOne({ userId, wallet: "spot", asset: "USDT" });
    const perpetual = await collections.wallets().findOne({ userId, wallet: "perpetual", asset: "USDT" });
    expect(toBig(spot.balance).eq(0)).toBe(true);
    expect(toBig(perpetual.balance).toFixed()).toBe(balance);
  });

  it("rejects zero, negative and non-numeric amounts", () => {
    ["", "0", "-5", "abc", "1e5"].forEach((amount) => {
      expect(transferSchema.safeParse({ from: "spot", to: "perpetual", asset: "USDT", amount }).success).toBe(false);
    });
  });

  it("rejects amounts with more than 8 decimals so the ledger cannot round them away", () => {
    expect(transferSchema.safeParse({ from: "spot", to: "perpetual", asset: "USDT", amount: "0.123456789" }).success).toBe(false);
    expect(transferSchema.safeParse({ from: "spot", to: "perpetual", asset: "USDT", amount: "0.12345678" }).success).toBe(true);
  });
});

describe("Withdrawal checks", () => {
  const withdrawal = { asset: "USDT", network: "TRC20", address: "TXn9Yh1a2b3c4d5e6f7g8h9i0jklmnopqr", amount: "50", pin: "123456" };

  it("refuses when no PIN is set", async () => {
    const userId = "u-withdraw-nopin";
    await postEntries([{ userId, wallet: "spot", asset: "USDT", type: "faucet", amount: 100 }], null);
    await expect(checkWithdrawal(userId, withdrawSchema.parse(withdrawal))).rejects.toThrow(/PIN is incorrect or not set/i);
  });

  it("refuses a wrong PIN before checking the balance", async () => {
    const userId = "u-withdraw-wrongpin";
    await setPin(userId, "123456");
    await expect(checkWithdrawal(userId, withdrawSchema.parse({ ...withdrawal, pin: "000000" }))).rejects.toThrow(/PIN is incorrect/i);
  });

  it("refuses when the spot balance is too low", async () => {
    const userId = "u-withdraw-poor";
    await setPin(userId, "123456");
    await postEntries([{ userId, wallet: "spot", asset: "USDT", type: "faucet", amount: 10 }], null);
    await expect(checkWithdrawal(userId, withdrawSchema.parse(withdrawal))).rejects.toThrow(/Insufficient USDT/i);
  });

  it("always refuses the payout and never moves money, even when everything checks out", async () => {
    const userId = "u-withdraw-ok";
    await setPin(userId, "123456");
    await postEntries([{ userId, wallet: "spot", asset: "USDT", type: "faucet", amount: 100 }], null);
    await expect(checkWithdrawal(userId, withdrawSchema.parse(withdrawal))).rejects.toThrow(/Practice balances cannot be sent/i);
    const wallet = await collections.wallets().findOne({ userId, wallet: "spot", asset: "USDT" });
    expect(Number(wallet.balance)).toBe(100);
    expect(await collections.ledger().countDocuments({ userId, type: "withdraw" })).toBe(0);
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
    await expect(claimFaucet(userId)).rejects.toThrow(/full practice/i);
  });

  it("does not burn the cooldown when spot is already at the cap", async () => {
    const userId = "u-faucet-full";
    await postEntries([{ userId, wallet: "spot", asset: "USDT", type: "faucet", amount: 100000 }], null);
    await expect(claimFaucet(userId)).rejects.toThrow(/full practice/i);
    const security = await collections.security().findOne({ userId });
    expect(security?.faucetClaimedAt).toBeUndefined();
  });
});
