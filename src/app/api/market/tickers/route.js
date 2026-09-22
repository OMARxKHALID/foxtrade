import { connection } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { fetchTickers } from "@/lib/market/binance-rest";
import { transformTicker } from "@/lib/market/overlay";
import { clientIp, rateLimit, rateLimitedResponse } from "@/lib/rate-limit";


export const GET = async (request) => {
  await connection();
  const throttle = await rateLimit(`market:tickers:${await clientIp()}`, { limit: 120, windowSeconds: 60 });
  if (!throttle.allowed) return rateLimitedResponse(throttle.retryAfter);
  const raw = request.nextUrl.searchParams.get("symbols");
  let symbols;
  try {
    symbols = JSON.parse(raw ?? "[]");
  } catch {
    symbols = [];
  }
  if (!Array.isArray(symbols) || !symbols.length || symbols.length > 200 || symbols.some((symbol) => !/^[a-zA-Z0-9]{5,15}$/.test(symbol))) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }
  try {
    const tickers = await fetchTickers(symbols);
    const user = await getCurrentUser().catch(() => null);
    if (user?.id) {
      return Response.json(await Promise.all(tickers.map((ticker) => transformTicker(user.id, ticker))));
    }
    return Response.json(tickers);
  } catch (error) {
    console.error("Ticker proxy failed:", error);
    return Response.json({ error: "Market data unavailable" }, { status: 502 });
  }
};
