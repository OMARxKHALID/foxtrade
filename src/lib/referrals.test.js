import { beforeEach, describe, expect, it } from "vitest";
import { collections } from "@/lib/mongo";
import { getInvite, inviteCodeSchema, listInvited, recordSignup } from "@/lib/referrals";

const referrer = { id: "u-referrer", email: "referrer@example.com" };

beforeEach(async () => {
  await collections.invites().deleteMany({});
});

describe("Invite codes", () => {
  it("creates one stable code per user", async () => {
    const first = await getInvite(referrer.id, referrer.email);
    const second = await getInvite(referrer.id, referrer.email);
    expect(first.code).toMatch(inviteCodeSchema);
    expect(second.code).toBe(first.code);
    expect(await collections.invites().countDocuments({ userId: referrer.id })).toBe(1);
  });

  it("gives different users different codes", async () => {
    const mine = await getInvite(referrer.id, referrer.email);
    const theirs = await getInvite("u-other", "other@example.com");
    expect(theirs.code).not.toBe(mine.code);
  });
});

describe("Sign-up referrals", () => {
  it("links a new user to the referrer and lists them masked", async () => {
    const invite = await getInvite(referrer.id, referrer.email);
    await recordSignup({ userId: "u-friend", email: "friend@example.com", code: invite.code });
    const invited = await listInvited(referrer.id);
    expect(invited).toHaveLength(1);
    expect(invited[0].id).toBe("u-friend");
    expect(invited[0].email).toBe("fr••••@example.com");
    expect(invited[0].email).not.toContain("friend@");
  });

  it("still creates an invite when the code is unknown, missing or malformed", async () => {
    await recordSignup({ userId: "u-a", email: "a@example.com", code: "ZZZZZZZZ" });
    await recordSignup({ userId: "u-b", email: "b@example.com" });
    await recordSignup({ userId: "u-c", email: "c@example.com", code: "../../etc" });
    const docs = await collections.invites().find({ userId: { $in: ["u-a", "u-b", "u-c"] } }).toArray();
    expect(docs).toHaveLength(3);
    expect(docs.every((doc) => doc.referrerId === null)).toBe(true);
  });

  it("ignores a user's own code", async () => {
    const invite = await getInvite(referrer.id, referrer.email);
    await recordSignup({ userId: referrer.id, email: referrer.email, code: invite.code });
    expect(await listInvited(referrer.id)).toHaveLength(0);
    expect(await collections.invites().countDocuments({ userId: referrer.id })).toBe(1);
  });

  it("keeps the first referrer if the same user signs up twice", async () => {
    const invite = await getInvite(referrer.id, referrer.email);
    await recordSignup({ userId: "u-friend", email: "friend@example.com", code: invite.code });
    const other = await getInvite("u-other", "other@example.com");
    await recordSignup({ userId: "u-friend", email: "friend@example.com", code: other.code });
    expect(await listInvited("u-other")).toHaveLength(0);
    expect(await listInvited(referrer.id)).toHaveLength(1);
  });
});
