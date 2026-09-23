import { describe, expect, it, beforeEach, vi } from "vitest";
import { collections } from "@/lib/mongo";
import { clearErrors, listErrors, reportError } from "./error-log";
import { serverFailure } from "./server-result";

beforeEach(async () => {
  await collections.errors().deleteMany({});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("Grouping", () => {
  it("counts repeats of the same fault once instead of filling the log", async () => {
    const boom = () => new Error("Binance request failed");
    await reportError(boom(), { route: "market/klines" });
    await reportError(boom(), { route: "market/klines" });
    await reportError(boom(), { route: "market/klines" });

    const errors = await listErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].count).toBe(3);
  });

  it("groups occurrences that differ only by an id or a number", async () => {
    // One throw site, different ids each time, which is how this shows up in practice.
    const failFor = (id) => new Error(`Position ${id} failed to close`);
    await reportError(failFor("6ab2439823e12519cdc2d3fc"));
    await reportError(failFor("507f1f77bcf86cd799439011"));

    expect(await listErrors()).toHaveLength(1);
  });

  it("keeps genuinely different faults apart", async () => {
    await reportError(new Error("Binance request failed"));
    await reportError(new TypeError("cn is not defined"));

    expect(await listErrors()).toHaveLength(2);
  });

  it("records where it happened and when it was first seen", async () => {
    await reportError(new Error("Settlement failed"), { job: "settleUser", userId: "u-1" });

    const [entry] = await listErrors();
    expect(entry.context).toEqual({ job: "settleUser", userId: "u-1" });
    expect(entry.firstSeenAt).toEqual(expect.any(String));
    expect(entry.stack).toContain("Error");
  });
});

describe("Logging never breaks the request", () => {
  it("swallows a failure inside the logger itself", async () => {
    vi.spyOn(collections, "errors").mockImplementationOnce(() => {
      throw new Error("mongo is down");
    });

    await expect(reportError(new Error("original problem"))).resolves.toBeUndefined();
  });

  it("handles being handed something that is not an error", async () => {
    await expect(reportError("just a string")).resolves.toBeUndefined();
    expect((await listErrors())[0].message).toBe("just a string");
  });
});

describe("serverFailure decides what is worth recording", () => {
  it("records an unexpected fault and hides it from the client", async () => {
    const result = serverFailure(new Error("Cannot read properties of undefined"), { action: "placeOrder" });

    expect(result).toEqual({ ok: false, formError: "Something went wrong. Please try again." });
    await settle();
    const [entry] = await listErrors();
    expect(entry.context).toEqual({ action: "placeOrder" });
  });

  it("does not record an expected LedgerError meant for the client", async () => {
    const error = new Error("Insufficient USDT in your Spot Wallet.");
    error.name = "LedgerError";

    const result = serverFailure(error);

    expect(result.formError).toBe("Insufficient USDT in your Spot Wallet.");
    await settle();
    expect(await listErrors()).toHaveLength(0);
  });
});

describe("Clearing", () => {
  it("empties the log and reports how many went", async () => {
    await reportError(new Error("one"));
    await reportError(new Error("two"));

    expect(await clearErrors()).toBe(2);
    expect(await listErrors()).toHaveLength(0);
  });
});
