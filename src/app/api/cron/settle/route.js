import { timingSafeEqual } from "node:crypto";
import { NextResponse, connection } from "next/server";
import { getEnv } from "@/lib/env";
import { settleAll } from "@/features/trading/dal/trading-engine";

const authorized = (request) => {
  const secret = getEnv().CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || provided.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
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
