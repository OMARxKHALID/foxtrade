import { NextResponse } from "next/server";
import { reportError } from "@/lib/error-log";
import { clientIp, rateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { resolveMode } from "@/lib/trading-mode";
import { getTradingSnapshot } from "@/features/trading/dal/trading-engine";

export const GET = async (request) => {
  const market = request.nextUrl.searchParams.get("market") === "timed" ? "timed" : "perpetual";
  const user = await getCurrentUser().catch(() => null);
  const limit = await rateLimit(user ? `orders-read:user:${user.id}` : `orders-read:ip:${await clientIp()}`, { limit: user ? 180 : 60, windowSeconds: 60 });
  if (!limit.allowed) return rateLimitedResponse(limit.retryAfter);
  if (!user) return NextResponse.json({ signedIn: false, available: 0, items: [] }, { headers: { "Cache-Control": "no-store" } });
  try {
    const snapshot = await getTradingSnapshot(user.id, market, await resolveMode(user));
    return NextResponse.json({ signedIn: true, ...snapshot }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await reportError(error, { route: "trading/orders", market, userId: user.id });
    return NextResponse.json({ error: "Could not load orders" }, { status: 500 });
  }
};
