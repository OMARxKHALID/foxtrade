import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, connection } from "next/server";
import { getEnv } from "@/lib/env";
import { settleAll } from "@/features/trading/dal/trading-engine";

const digest = (value) => createHash("sha256").update(value).digest();

const authorized = (request) => {
  const secret = getEnv().CRON_SECRET;
  if (!secret) return false;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return timingSafeEqual(digest(provided), digest(secret));
};

export const GET = async (request) => {
  await connection();
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const users = await settleAll();
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    console.error("Settlement sweep failed:", error);
    return NextResponse.json({ error: "Settlement sweep failed" }, { status: 500 });
  }
};
