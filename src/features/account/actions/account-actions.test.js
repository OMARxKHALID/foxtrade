import { Collection } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { collections } from "@/lib/mongo";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth", () => ({ getAuth: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/document-storage", async (importOriginal) => ({
  ...(await importOriginal()),
  isDocumentStorageConfigured: () => true,
  uploadPrivateImage: vi.fn(async (buffer, { folder, publicId }) => ({ publicId: `${folder}/${publicId}`, format: buffer[0] === 0x25 ? "pdf" : "jpg", bytes: buffer.length })),
  deletePrivateImages: vi.fn(async () => {}),
}));

const { getCurrentUser } = await import("@/lib/session");
const { deletePrivateImages } = await import("@/lib/document-storage");
const { submitBasicVerification, uploadVerificationDocument } = await import("./account-actions");

const user = { id: "u-kyc", email: "kyc@example.com" };
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

const upload = (side, bytes, type) => {
  const formData = new FormData();
  formData.append("side", side);
  formData.append("file", new File([bytes], `id.${type.split("/")[1]}`, { type }));
  return uploadVerificationDocument(formData);
};

const documents = async () => (await collections.verifications().findOne({ userId: user.id })).documents;

beforeEach(async () => {
  await Promise.all(Object.values(collections).map((collection) => collection().deleteMany({})));
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(user);
  await collections.verifications().insertOne({ userId: user.id, email: user.email, status: "approved" });
});

describe("Basic verification resubmit", () => {
  it("does not overwrite an approval that lands between the status read and the write", async () => {
    await collections.verifications().updateOne({ userId: user.id }, { $set: { status: "rejected", fullName: "Old Name" } });
    const originalFindOne = Collection.prototype.findOne;
    const spy = vi.spyOn(Collection.prototype, "findOne").mockImplementationOnce(async function (...args) {
      const doc = await originalFindOne.apply(this, args);
      await collections.verifications().updateOne({ userId: user.id }, { $set: { status: "approved" } });
      return doc;
    });
    const result = await submitBasicVerification({ country: "Pakistan", fullName: "New Name", idNumber: "12345678", city: "Lahore" });
    spy.mockRestore();
    expect(result.ok).toBe(false);
    const record = await collections.verifications().findOne({ userId: user.id });
    expect(record.status).toBe("approved");
    expect(record.fullName).toBe("Old Name");
  });

  it("creates a submission for a first-time user", async () => {
    await collections.verifications().deleteMany({});
    const result = await submitBasicVerification({ country: "Pakistan", fullName: "New Name", idNumber: "12345678", city: "Lahore" });
    expect(result.ok).toBe(true);
    expect(await collections.verifications().countDocuments({ userId: user.id, status: "pending" })).toBe(1);
  });
});

describe("KYC document upload", () => {
  it("stores one PDF as both sides and removes the images it replaces", async () => {
    expect((await upload("front", jpg, "image/jpeg")).ok).toBe(true);
    expect((await upload("back", jpg, "image/jpeg")).ok).toBe(true);
    deletePrivateImages.mockClear();
    expect((await upload("both", pdf, "application/pdf")).ok).toBe(true);
    const stored = await documents();
    expect(stored.front.publicId).toBe("kyc/u-kyc/both");
    expect(stored.back.publicId).toBe("kyc/u-kyc/both");
    expect(stored.front.format).toBe("pdf");
    expect(deletePrivateImages).toHaveBeenCalledWith(["kyc/u-kyc/front", "kyc/u-kyc/back"]);
  });

  it("rejects an image uploaded as both sides", async () => {
    const result = await upload("both", jpg, "image/jpeg");
    expect(result.ok).toBe(false);
    expect(result.formError).toMatch(/PDF/);
    expect((await documents())?.front).toBeUndefined();
  });

  it("accepts a PDF for a single side", async () => {
    expect((await upload("back", pdf, "application/pdf")).ok).toBe(true);
    expect((await documents()).back.format).toBe("pdf");
  });

  it("keeps the combined PDF until both sides are replaced", async () => {
    await upload("both", pdf, "application/pdf");
    deletePrivateImages.mockClear();
    await upload("front", jpg, "image/jpeg");
    expect(deletePrivateImages).toHaveBeenCalledWith([]);
    expect((await documents()).back.publicId).toBe("kyc/u-kyc/both");
    await upload("back", jpg, "image/jpeg");
    expect(deletePrivateImages).toHaveBeenLastCalledWith(["kyc/u-kyc/both"]);
  });
});
