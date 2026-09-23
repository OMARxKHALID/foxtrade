import { ObjectId } from "mongodb";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { collections } from "@/lib/mongo";
import { LIVE, PRACTICE } from "@/lib/ledger";
import { writePlatformSettings, defaultPlatformSettings } from "@/lib/platform-settings";
import { liveAvailableFor, resolveMode, setTradingMode } from "./trading-mode";

vi.mock("@/lib/cached-settings", async () => {
  const { readPlatformSettings } = await import("@/lib/platform-settings");
  return { getPlatformSettings: readPlatformSettings, settingsTags: { platform: "platform-settings" } };
});

const userId = "ab1cab1cab1cab1cab1cab1c";
const user = { id: userId };

const setup = async ({ live, tradingMode, kyc, banned = false }) => {
  await writePlatformSettings({ ...defaultPlatformSettings, liveTradingEnabled: live });
  await collections.users().insertOne({ _id: new ObjectId(userId), email: "t@test.dev", tradingMode, banned });
  if (kyc) await collections.verifications().insertOne({ userId, email: "t@test.dev", status: kyc, documents: { status: kyc } });
};

beforeEach(async () => {
  for (const collection of Object.values(collections)) await collection().deleteMany({});
});

describe("Mode resolution fails closed", () => {
  it("returns live only when the platform, the user and KYC all agree", async () => {
    await setup({ live: true, tradingMode: LIVE, kyc: "approved" });
    expect(await resolveMode(user)).toBe(LIVE);
  });

  it("falls back to practice when the platform has live trading off", async () => {
    await setup({ live: false, tradingMode: LIVE, kyc: "approved" });
    expect(await resolveMode(user)).toBe(PRACTICE);
  });

  it("falls back to practice when the user has not opted in", async () => {
    await setup({ live: true, tradingMode: PRACTICE, kyc: "approved" });
    expect(await resolveMode(user)).toBe(PRACTICE);
  });

  it("falls back to practice when KYC is not approved", async () => {
    await setup({ live: true, tradingMode: LIVE, kyc: "pending" });
    expect(await resolveMode(user)).toBe(PRACTICE);
  });

  it("falls back to practice when basic details are approved but documents are not", async () => {
    await setup({ live: true, tradingMode: LIVE, kyc: null });
    await collections.verifications().insertOne({ userId, email: "t@test.dev", status: "approved", documents: { status: "pending" } });
    expect(await resolveMode(user)).toBe(PRACTICE);
    expect((await liveAvailableFor(user)).reason).toBe("unverified");
  });

  it("falls back to practice when there is no KYC record at all", async () => {
    await setup({ live: true, tradingMode: LIVE, kyc: null });
    expect(await resolveMode(user)).toBe(PRACTICE);
  });

  it("falls back to practice for a banned account", async () => {
    await setup({ live: true, tradingMode: LIVE, kyc: "approved", banned: true });
    expect(await resolveMode(user)).toBe(PRACTICE);
  });

  it("falls back to practice for a signed out visitor", async () => {
    await writePlatformSettings({ ...defaultPlatformSettings, liveTradingEnabled: true });
    expect(await resolveMode(null)).toBe(PRACTICE);
    expect(await resolveMode({ id: "not-an-object-id" })).toBe(PRACTICE);
  });
});

describe("Opting in", () => {
  it("refuses to store live mode when the user cannot use it", async () => {
    await setup({ live: true, tradingMode: PRACTICE, kyc: "pending" });

    expect(await setTradingMode(userId, LIVE)).toBe(PRACTICE);
    expect((await collections.users().findOne({ _id: new ObjectId(userId) })).tradingMode).toBe(PRACTICE);
  });

  it("stores live mode once the gates pass, and back again", async () => {
    await setup({ live: true, tradingMode: PRACTICE, kyc: "approved" });

    expect(await setTradingMode(userId, LIVE)).toBe(LIVE);
    expect(await resolveMode(user)).toBe(LIVE);

    expect(await setTradingMode(userId, PRACTICE)).toBe(PRACTICE);
    expect(await resolveMode(user)).toBe(PRACTICE);
  });

  it("explains why live is unavailable", async () => {
    await setup({ live: false, tradingMode: PRACTICE, kyc: "approved" });
    expect((await liveAvailableFor(user)).reason).toBe("disabled");

    await writePlatformSettings({ ...defaultPlatformSettings, liveTradingEnabled: true });
    await collections.verifications().updateOne({ userId }, { $set: { status: "pending" } });
    expect((await liveAvailableFor(user)).reason).toBe("unverified");
  });
});
