import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { collections } from "@/lib/mongo";
import { postEntries } from "@/lib/ledger";
import { writePairs } from "@/lib/market/pair-store";
import { defaultPairs } from "@/lib/market/pairs";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {}, updateTag: () => {} }));
vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn(), isAdmin: (user) => user?.role === "admin", requireAdmin: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { removeUser: vi.fn(async () => ({})) } }) }));
vi.mock("@/lib/document-storage", () => ({ deletePrivateImages: vi.fn(async () => {}) }));

const { getCurrentUser } = await import("@/lib/session");
const { deletePrivateImages } = await import("@/lib/document-storage");
const { adjustClientBalance, deleteClient } = await import("./admin-actions");

const adminId = new ObjectId();
const clientId = new ObjectId();
const admin = { id: adminId.toString(), email: "admin@example.com", role: "admin" };
const balanceOf = async (userId) => Number((await collections.wallets().findOne({ userId, wallet: "spot", asset: "USDT" }))?.balance ?? 0);

beforeEach(async () => {
  await Promise.all(Object.values(collections).map((collection) => collection().deleteMany({})));
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(admin);
  await writePairs(defaultPairs);
  await collections.users().insertMany([
    { _id: adminId, email: admin.email, role: "admin", createdAt: new Date() },
    { _id: clientId, email: "client@example.com", role: "user", createdAt: new Date() },
  ]);
  await postEntries([{ userId: clientId.toString(), wallet: "spot", asset: "USDT", type: "faucet", amount: 100 }], null);
});

describe("Admin authorization", () => {
  it("refuses a balance adjustment from a client account", async () => {
    getCurrentUser.mockResolvedValue({ id: clientId.toString(), email: "client@example.com", role: "user" });
    const result = await adjustClientBalance({ userId: clientId.toString(), wallet: "spot", asset: "USDT", amount: "50", note: "Bonus" });
    expect(result.ok).toBe(false);
    expect(await balanceOf(clientId.toString())).toBe(100);
    expect(await collections.audit().countDocuments({})).toBe(0);
  });

  it("refuses when signed out", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await adjustClientBalance({ userId: clientId.toString(), wallet: "spot", asset: "USDT", amount: "50", note: "Bonus" });
    expect(result.ok).toBe(false);
    expect(await balanceOf(clientId.toString())).toBe(100);
  });
});

describe("Balance adjustments", () => {
  it("credits a full-precision amount and audits it as a credit", async () => {
    const result = await adjustClientBalance({ userId: clientId.toString(), wallet: "spot", asset: "USDT", amount: "0.12345678", note: "Correction" });
    expect(result.ok).toBe(true);
    expect(await balanceOf(clientId.toString())).toBe(100.12345678);
    const audit = await collections.audit().findOne({});
    expect(audit.action).toBe("client.credit");
    expect(audit.detail).toContain("+0.12345678 USDT");
  });

  it("debits and audits it as a debit", async () => {
    const result = await adjustClientBalance({ userId: clientId.toString(), wallet: "spot", asset: "USDT", amount: "-40", note: "Reversal" });
    expect(result.ok).toBe(true);
    expect(await balanceOf(clientId.toString())).toBe(60);
    expect((await collections.audit().findOne({})).action).toBe("client.debit");
  });

  it("refuses a debit larger than the balance and leaves no ledger row", async () => {
    const result = await adjustClientBalance({ userId: clientId.toString(), wallet: "spot", asset: "USDT", amount: "-500", note: "Too much" });
    expect(result.ok).toBe(false);
    expect(await balanceOf(clientId.toString())).toBe(100);
    expect(await collections.ledger().countDocuments({ type: "admin_adjust" })).toBe(0);
  });

  it("rejects zero, malformed and unlisted-asset adjustments", async () => {
    const base = { userId: clientId.toString(), wallet: "spot", asset: "USDT", note: "Nope" };
    expect((await adjustClientBalance({ ...base, amount: "0" })).ok).toBe(false);
    expect((await adjustClientBalance({ ...base, amount: "abc" })).ok).toBe(false);
    expect((await adjustClientBalance({ ...base, asset: "NOTLISTED", amount: "10" })).ok).toBe(false);
    expect(await balanceOf(clientId.toString())).toBe(100);
  });
});

describe("Deleting a client", () => {
  it("removes owned data, keeps the invite link history consistent and audits it", async () => {
    await collections.invites().insertMany([
      { userId: clientId.toString(), email: "client@example.com", code: "AAAA2222", referrerId: null, joinedAt: new Date() },
      { userId: "u-friend", email: "friend@example.com", code: "BBBB3333", referrerId: clientId.toString(), joinedAt: new Date() },
    ]);
    const result = await deleteClient(clientId.toString());
    expect(result.ok).toBe(true);
    expect(await collections.wallets().countDocuments({ userId: clientId.toString() })).toBe(0);
    expect(await collections.ledger().countDocuments({ userId: clientId.toString() })).toBe(0);
    expect(await collections.invites().countDocuments({ userId: clientId.toString() })).toBe(0);
    expect((await collections.invites().findOne({ userId: "u-friend" })).referrerId).toBeNull();
    expect((await collections.audit().findOne({})).action).toBe("client.delete");
  });

  it("still deletes the client when document storage is down", async () => {
    await collections.verifications().insertOne({ userId: clientId.toString(), documents: { front: { publicId: "kyc/c/front" } } });
    deletePrivateImages.mockRejectedValueOnce(new Error("Cloudinary 503"));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await deleteClient(clientId.toString());
    expect(result.ok).toBe(true);
    expect(await collections.verifications().countDocuments({ userId: clientId.toString() })).toBe(0);
    expect(logged).toHaveBeenCalledWith(expect.stringContaining("Could not delete KYC files"), expect.any(Error));
    logged.mockRestore();
  });

  it("refuses to delete an admin account", async () => {
    await collections.users().updateOne({ _id: clientId }, { $set: { role: "admin" } });
    const result = await deleteClient(clientId.toString());
    expect(result.ok).toBe(false);
    expect(await collections.wallets().countDocuments({ userId: clientId.toString() })).toBe(1);
  });
});
