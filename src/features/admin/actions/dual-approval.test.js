import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { collections } from "@/lib/mongo";
import { LIVE, PRACTICE, getBalance, postEntries } from "@/lib/ledger";
import { writePairs } from "@/lib/market/pair-store";
import { defaultPairs } from "@/lib/market/pairs";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn(), isAdmin: (user) => user?.role === "admin", requireAdmin: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: {} }) }));
vi.mock("@/lib/document-storage", () => ({ deletePrivateImages: vi.fn(async () => {}) }));

const { getCurrentUser } = await import("@/lib/session");
const { adjustClientBalance, approveAdjustment, rejectAdjustment } = await import("./admin-actions");

const firstId = new ObjectId();
const secondId = new ObjectId();
const clientId = new ObjectId();
const first = { id: firstId.toString(), email: "first@example.com", role: "admin" };
const second = { id: secondId.toString(), email: "second@example.com", role: "admin" };

const liveBalance = async () => Number(await getBalance(clientId.toString(), "spot", "USDT", null, LIVE));
const practiceBalance = async () => Number(await getBalance(clientId.toString(), "spot", "USDT", null, PRACTICE));

const request = (mode, amount = "500") =>
  adjustClientBalance({ userId: clientId.toString(), mode, wallet: "spot", asset: "USDT", amount, note: "Goodwill" });

beforeEach(async () => {
  await Promise.all(Object.values(collections).map((collection) => collection().deleteMany({})));
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(first);
  await writePairs(defaultPairs);
  await collections.users().insertMany([
    { _id: firstId, email: first.email, role: "admin", createdAt: new Date() },
    { _id: secondId, email: second.email, role: "admin", createdAt: new Date() },
    { _id: clientId, email: "client@example.com", role: "user", createdAt: new Date() },
  ]);
  await postEntries([{ userId: clientId.toString(), mode: PRACTICE, wallet: "spot", asset: "USDT", type: "faucet", amount: 100 }], null);
});

describe("Practice balances stay single admin", () => {
  it("posts immediately without an approval step", async () => {
    const result = await request(PRACTICE, "50");

    expect(result.ok).toBe(true);
    expect(result.data.pending).toBe(false);
    expect(await practiceBalance()).toBe(150);
    expect(await collections.adjustments().countDocuments({})).toBe(0);
  });
});

describe("Live balance changes need a second admin", () => {
  it("does not move money when first requested", async () => {
    const result = await request(LIVE);

    expect(result.data.pending).toBe(true);
    expect(await liveBalance()).toBe(0);
    expect(await collections.adjustments().countDocuments({ status: "pending" })).toBe(1);
  });

  it("refuses to let the requester approve their own request", async () => {
    await request(LIVE);
    const { _id } = await collections.adjustments().findOne({ status: "pending" });

    const result = await approveAdjustment(_id.toString());

    expect(result.ok).toBe(false);
    expect(result.formError).toMatch(/second admin/i);
    expect(await liveBalance()).toBe(0);
  });

  it("posts the money once a different admin approves", async () => {
    await request(LIVE);
    const { _id } = await collections.adjustments().findOne({ status: "pending" });

    getCurrentUser.mockResolvedValue(second);
    const result = await approveAdjustment(_id.toString());

    expect(result.ok).toBe(true);
    expect(await liveBalance()).toBe(500);
    expect((await collections.adjustments().findOne({ _id })).status).toBe("approved");
  });

  it("cannot be approved twice", async () => {
    await request(LIVE);
    const { _id } = await collections.adjustments().findOne({ status: "pending" });
    getCurrentUser.mockResolvedValue(second);
    await approveAdjustment(_id.toString());

    const replay = await approveAdjustment(_id.toString());

    expect(replay.ok).toBe(false);
    expect(await liveBalance()).toBe(500);
  });

  it("moves no money when rejected", async () => {
    await request(LIVE);
    const { _id } = await collections.adjustments().findOne({ status: "pending" });

    getCurrentUser.mockResolvedValue(second);
    await rejectAdjustment(_id.toString());

    expect(await liveBalance()).toBe(0);
    expect((await collections.adjustments().findOne({ _id })).status).toBe("rejected");
  });

});
