import { connection } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { fetchKlines } from "@/lib/market/binance-rest";
import { transformCandles } from "@/lib/market/overlay";
import { reportError } from "@/lib/error-log";
import { clientIp, rateLimit, rateLimitedResponse } from "@/lib/rate-limit";


const INTERVALS = new Set(["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w"]);

const intervalSeconds = (interval) => {
  const value = Number.parseInt(interval, 10);
  const unit = interval.at(-1);
  const multipliers = { m: 60, h: 3600, d: 86400, w: 604800 };
  return value * (multipliers[unit] ?? 60);
};

export const GET = async (request) => {
  await connection();
  const throttle = await rateLimit(`market:klines:${await clientIp()}`, { limit: 120, windowSeconds: 60 });
  if (!throttle.allowed) return rateLimitedResponse(throttle.retryAfter);
  const params = request.nextUrl.searchParams;
  const symbol = params.get("symbol") ?? "";
  const interval = params.get("interval") ?? "";
  const limit = Math.min(Math.max(Math.trunc(Number(params.get("limit"))) || 500, 1), 1000);
  const endTime = Number(params.get("endTime")) || undefined;
  if (!/^[a-zA-Z0-9]{5,15}$/.test(symbol) || !INTERVALS.has(interval)) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }
  try {
    const klines = await fetchKlines({ symbol, interval, limit, endTime });
    const user = await getCurrentUser().catch(() => null);
    if (user?.id) {
      const stepMs = intervalSeconds(interval) * 1000;
      const withMs = klines.map(({ time, ...rest }) => ({ openTime: time * 1000, ...rest }));
      const steered = await transformCandles(user.id, symbol, withMs, stepMs);
      return Response.json(steered.map(({ openTime, ...rest }) => ({ time: Math.floor(openTime / 1000), ...rest })));
    }
    return Response.json(klines);
  } catch (error) {
    await reportError(error, { route: "market/klines", symbol, interval });
    return Response.json({ error: "Market data unavailable" }, { status: 502 });
  }
};
