import { describe, expect, it, beforeEach } from "vitest";
import { collections } from "@/lib/mongo";
import { LIVE, PRACTICE, getBalance, postEntries } from "@/lib/ledger";
import {
  HOLD_WALLET,
  approveWithdrawal,
  createDepositIntent,
  creditDeposit,
  rejectDeposit,
  markWithdrawalSent,
  rejectWithdrawal,
  requestWithdrawal,
} from "./funding-dal";

const userId = "funding-user";
const adminId = "admin-user";

const verify = (status) => collections.verifications().insertOne({ userId, email: "f@test.dev", status });
const fundLive = (amount) => postEntries([{ userId, mode: LIVE, wallet: "spot", asset: "USDT", type: "deposit", amount }], null);
const liveSpot = async () => Number(await getBalance(userId, "spot", "USDT", null, LIVE));
const held = async () => Number(await getBalance(userId, HOLD_WALLET, "USDT", null, LIVE));

beforeEach(async () => {
  for (const collection of Object.values(collections)) await collection().deleteMany({});
});

describe("Identity gate", () => {
  it("refuses deposits and withdrawals until verification is approved", async () => {
    await verify("pending");
    await expect(createDepositIntent(userId, { asset: "USDT", amount: 100, provider: "test" })).rejects.toThrow(/Verify your identity/);
    await expect(requestWithdrawal(userId, { asset: "USDT", amount: 100, address: "0xabc", network: "ETH" })).rejects.toThrow(/Verify your identity/);
  });

  it("refuses to move real funds for a practice account", async () => {
    await verify("approved");
    await expect(createDepositIntent(userId, { asset: "USDT", amount: 100, provider: "test" }, PRACTICE)).rejects.toThrow(/live accounts/);
  });
});

describe("Deposits", () => {
  beforeEach(() => verify("approved"));

  it("credits the live spot wallet once the provider confirms", async () => {
    const id = await createDepositIntent(userId, { asset: "USDT", amount: 250, provider: "test" });
    expect(await liveSpot()).toBe(0);

    const result = await creditDeposit({ provider: "test", providerRef: "tx-1", depositId: id, amount: 250 });

    expect(result.credited).toBe(true);
    expect(await liveSpot()).toBe(250);
  });

  it("keeps several transfers waiting at once", async () => {
    const first = await createDepositIntent(userId, { asset: "USDT", amount: 100, provider: "manual", network: "TRC20", reference: "hash-one" });
    const second = await createDepositIntent(userId, { asset: "USDT", amount: 250, provider: "manual", network: "TRC20", reference: "hash-two" });

    expect(first).not.toBe(second);
    expect(await collections.deposits().countDocuments({ status: "pending" })).toBe(2);
  });

  it("refuses the same transaction hash twice", async () => {
    await createDepositIntent(userId, { asset: "USDT", amount: 100, provider: "manual", reference: "hash-one" });

    await expect(createDepositIntent(userId, { asset: "USDT", amount: 100, provider: "manual", reference: "hash-one" })).rejects.toThrow(/already been submitted/);
  });

  it("credits what the admin confirms, not what the client claimed", async () => {
    const id = await createDepositIntent(userId, { asset: "USDT", amount: 999, provider: "manual", reference: "hash-one" });

    await creditDeposit({ provider: "manual", providerRef: "hash-one", depositId: id, amount: 250 });

    expect(await liveSpot()).toBe(250);
  });

  it("credits nothing for a rejected transfer", async () => {
    const id = await createDepositIntent(userId, { asset: "USDT", amount: 100, provider: "manual", reference: "hash-one" });

    await rejectDeposit(id, { adminId, reason: "No transaction found" });

    expect(await liveSpot()).toBe(0);
    expect((await creditDeposit({ provider: "manual", providerRef: "hash-one", depositId: id, amount: 100 })).credited).toBe(false);
    expect(await liveSpot()).toBe(0);
  });

  it("does not credit twice when the provider retries the same payment", async () => {
    const id = await createDepositIntent(userId, { asset: "USDT", amount: 250, provider: "test" });
    await creditDeposit({ provider: "test", providerRef: "tx-1", depositId: id, amount: 250 });

    const replay = await creditDeposit({ provider: "test", providerRef: "tx-1", depositId: id, amount: 250 });

    expect(replay.credited).toBe(false);
    expect(await liveSpot()).toBe(250);
    expect(await collections.ledger().countDocuments({ userId, type: "deposit" })).toBe(1);
  });

});

describe("Withdrawals", () => {
  beforeEach(async () => {
    await verify("approved");
    await fundLive(500);
  });

  it("holds the funds at request time so the same balance cannot be requested twice", async () => {
    await requestWithdrawal(userId, { asset: "USDT", amount: 400, address: "0xabc", network: "ETH" });

    expect(await liveSpot()).toBe(100);
    expect(await held()).toBe(400);
    await expect(requestWithdrawal(userId, { asset: "USDT", amount: 400, address: "0xabc", network: "ETH" })).rejects.toThrow(/Insufficient/);
  });

  it("returns the money to spot when an admin rejects it", async () => {
    const id = await requestWithdrawal(userId, { asset: "USDT", amount: 400, address: "0xabc", network: "ETH" });

    await rejectWithdrawal(id, { adminId, reason: "Address not verified" });

    expect(await liveSpot()).toBe(500);
    expect(await held()).toBe(0);
    expect((await collections.withdrawals().findOne({})).status).toBe("rejected");
  });

  it("keeps the hold until the payout actually leaves", async () => {
    const id = await requestWithdrawal(userId, { asset: "USDT", amount: 400, address: "0xabc", network: "ETH" });

    await approveWithdrawal(id, { adminId });
    expect(await held()).toBe(400);

    await markWithdrawalSent(id, { providerRef: "payout-1" });
    expect(await held()).toBe(0);
    expect(await liveSpot()).toBe(100);
  });

  it("cannot be reviewed twice", async () => {
    const id = await requestWithdrawal(userId, { asset: "USDT", amount: 400, address: "0xabc", network: "ETH" });
    await approveWithdrawal(id, { adminId });

    await expect(rejectWithdrawal(id, { adminId, reason: "changed my mind" })).rejects.toThrow(/already reviewed/);
    expect(await liveSpot()).toBe(100);
  });

  it("refuses a payout that was never approved", async () => {
    const id = await requestWithdrawal(userId, { asset: "USDT", amount: 400, address: "0xabc", network: "ETH" });

    expect((await markWithdrawalSent(id, { providerRef: "payout-1" })).sent).toBe(false);
    expect(await held()).toBe(400);
  });
});
