import { connection } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { fetchRecentTrades } from "@/lib/market/binance-rest";
import { transformRecentTrades } from "@/lib/market/overlay";
import { clientIp, rateLimit } from "@/lib/rate-limit";


export const GET = async (request) => {
  await connection();
  const throttle = await rateLimit(`market:trades:${await clientIp()}`, { limit: 120, windowSeconds: 60 });
  if (!throttle.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });
  const params = request.nextUrl.searchParams;
  const symbol = params.get("symbol") ?? "";
  const limit = Math.min(Math.max(Math.trunc(Number(params.get("limit"))) || 40, 1), 500);
  if (!/^[a-zA-Z0-9]{5,15}$/.test(symbol)) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }
  try {
    const trades = await fetchRecentTrades(symbol, limit);
    const user = await getCurrentUser().catch(() => null);
    if (user?.id) {
      return Response.json(await transformRecentTrades(user.id, symbol, trades));
    }
    return Response.json(trades);
  } catch (error) {
    console.error(`Trades proxy failed for ${symbol}:`, error);
    return Response.json({ error: "Market data unavailable" }, { status: 502 });
  }
};
