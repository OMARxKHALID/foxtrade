import { describe, expect, it } from "vitest";
import { expectedReturn, isWinning, remainingFraction, secondsLeft, settledProfit } from "@/features/trading/components/timed-outcome";

const order = { direction: "call", openPrice: 1779.22, amount: 100, payoutRate: 0.82 };

describe("isWinning", () => {
  it("reads the mark against the open price per direction", () => {
    expect(isWinning("call", 100, 101)).toBe(true);
    expect(isWinning("call", 100, 99)).toBe(false);
    expect(isWinning("put", 100, 99)).toBe(true);
    expect(isWinning("put", 100, 101)).toBe(false);
  });

  it("returns null when the mark is missing or equal", () => {
    expect(isWinning("call", 100, 100)).toBeNull();
    expect(isWinning("call", 100, 0)).toBeNull();
    expect(isWinning("call", 100, undefined)).toBeNull();
  });
});

describe("expectedReturn", () => {
  it("pays the payout rate on a win and loses the whole stake", () => {
    expect(expectedReturn(order, 1780)).toBeCloseTo(82);
    expect(expectedReturn(order, 1778)).toBe(-100);
    expect(expectedReturn(order, 1779.22)).toBeNull();
  });
});

describe("secondsLeft", () => {
  const expiresAt = "2025-01-01T00:01:00.000Z";
  const at = (iso) => new Date(iso).getTime();

  it("rounds up and never goes below zero", () => {
    expect(secondsLeft(expiresAt, at("2025-01-01T00:00:00.000Z"))).toBe(60);
    expect(secondsLeft(expiresAt, at("2025-01-01T00:00:59.400Z"))).toBe(1);
    expect(secondsLeft(expiresAt, at("2025-01-01T00:02:00.000Z"))).toBe(0);
  });
});

describe("remainingFraction", () => {
  const openedAt = "2025-01-01T00:00:00.000Z";
  const expiresAt = "2025-01-01T00:01:00.000Z";
  const at = (iso) => new Date(iso).getTime();

  it("falls from one to zero across the window and clamps outside it", () => {
    expect(remainingFraction(openedAt, expiresAt, at("2025-01-01T00:00:00.000Z"))).toBe(1);
    expect(remainingFraction(openedAt, expiresAt, at("2025-01-01T00:00:30.000Z"))).toBeCloseTo(0.5);
    expect(remainingFraction(openedAt, expiresAt, at("2025-01-01T00:02:00.000Z"))).toBe(0);
    expect(remainingFraction(expiresAt, expiresAt, at("2025-01-01T00:00:30.000Z"))).toBe(0);
  });
});

describe("settledProfit", () => {
  it("is null while open or cancelled and the payout minus the stake once settled", () => {
    expect(settledProfit({ status: "open", amount: 100, payout: null })).toBeNull();
    expect(settledProfit({ status: "cancelled", amount: 100, payout: 0 })).toBeNull();
    expect(settledProfit({ status: "won", amount: 100, payout: 182 })).toBeCloseTo(82);
    expect(settledProfit({ status: "lost", amount: 100, payout: 0 })).toBe(-100);
    expect(settledProfit({ status: "draw", amount: 100, payout: 100 })).toBe(0);
  });
});
