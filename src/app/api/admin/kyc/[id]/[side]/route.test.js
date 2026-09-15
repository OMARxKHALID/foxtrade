import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { collections } from "@/lib/mongo";

vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn(), isAdmin: (user) => user?.role === "admin" }));
vi.mock("@/lib/document-storage", () => ({ privateImageUrl: vi.fn(() => "https://cloudinary.test/signed") }));

const { getCurrentUser } = await import("@/lib/session");
const { GET } = await import("./route");

const admin = { id: "u-admin", email: "admin@example.com", role: "admin" };
const submissionId = new ObjectId();

const request = new Request("https://app.test/api/admin/kyc/x/front");
const call = (id, side) => GET(request, { params: Promise.resolve({ id, side }) });

beforeEach(async () => {
  await collections.verifications().deleteMany({});
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(admin);
  globalThis.fetch = vi.fn(async () => new Response("file-bytes", { status: 200 }));
  await collections.verifications().insertOne({
    _id: submissionId,
    userId: "u-client",
    documents: { front: { publicId: "kyc/u-client/front", format: "jpg" }, back: { publicId: "kyc/u-client/back", format: "pdf" } },
  });
});

describe("KYC document route access", () => {
  it("hides documents from a signed-in client", async () => {
    getCurrentUser.mockResolvedValue({ id: "u-client", email: "client@example.com", role: "user" });
    const response = await call(submissionId.toString(), "front");
    expect(response.status).toBe(404);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("hides documents from signed-out visitors", async () => {
    getCurrentUser.mockRejectedValue(new Error("no session"));
    expect((await call(submissionId.toString(), "front")).status).toBe(404);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("rejects a malformed id and an unknown side without querying storage", async () => {
    expect((await call("not-an-object-id", "front")).status).toBe(404);
    expect((await call(submissionId.toString(), "../../etc/passwd")).status).toBe(404);
    expect((await call(new ObjectId().toString(), "front")).status).toBe(404);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe("KYC document delivery", () => {
  it("serves an image inline with private cache headers", async () => {
    const response = await call(submissionId.toString(), "front");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Disposition")).toBeNull();
  });

  it("forces a PDF to download instead of rendering in the browser", async () => {
    const response = await call(submissionId.toString(), "back");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(`attachment; filename="kyc-${submissionId.toString()}-back.pdf"`);
  });

  it("reports upstream failures as a bad gateway", async () => {
    globalThis.fetch = vi.fn(async () => new Response("gone", { status: 404 }));
    expect((await call(submissionId.toString(), "front")).status).toBe(502);
  });
});
