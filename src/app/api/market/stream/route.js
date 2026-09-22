import { connection } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { subscribeUpstream } from "@/lib/market/upstream";
import { transformAggTrade, transformDepth, transformKlineEvent, transformTickerItem } from "@/lib/market/overlay";
import { clientIp, rateLimit } from "@/lib/rate-limit";


const SYMBOL = "[a-z0-9]{5,15}";
const STREAM_PATTERNS = [
  /^!miniTicker@arr$/,
  new RegExp(`^(${SYMBOL})@kline_([0-9]+[mhdw])$`),
  new RegExp(`^(${SYMBOL})@aggTrade$`),
  new RegExp(`^(${SYMBOL})@depth20@100ms$`),
];
const MAX_STREAMS = 30;
const HEARTBEAT_MS = 15000;

const intervalSeconds = (interval) => {
  const value = Number.parseInt(interval, 10);
  const unit = interval.at(-1);
  const multipliers = { m: 60, h: 3600, d: 86400, w: 604800 };
  return value * (multipliers[unit] ?? 60);
};

const parseStreams = (value) => {
  const requested = (value ?? "").split(",").filter(Boolean);
  if (!requested.length || requested.length > MAX_STREAMS) return null;
  const parsed = requested.map((stream) => {
    for (const pattern of STREAM_PATTERNS) {
      const match = stream.match(pattern);
      if (match) return { stream, symbol: match[1]?.toUpperCase() ?? null, interval: match[2] ?? null };
    }
    return null;
  });
  if (parsed.some((item) => !item)) return null;
  return parsed;
};

const transformMessage = async (userId, parsed, data) => {
  if (!userId) return data;
  if (parsed.stream === "!miniTicker@arr") {
    return Promise.all(data.map((item) => transformTickerItem(userId, item)));
  }
  if (parsed.interval) {
    const kline = await transformKlineEvent(userId, parsed.symbol, data.k, intervalSeconds(parsed.interval));
    return { ...data, k: kline };
  }
  if (parsed.stream.endsWith("@aggTrade")) return transformAggTrade(userId, parsed.symbol, data);
  if (parsed.stream.includes("@depth")) return transformDepth(userId, parsed.symbol, data);
  return data;
};

export const GET = async (request) => {
  await connection();
  const throttle = await rateLimit(`market:stream:${await clientIp()}`, { limit: 30, windowSeconds: 60 });
  if (!throttle.allowed) return new Response("Too many requests", { status: 429, headers: { "Retry-After": String(throttle.retryAfter) } });
  const parsed = parseStreams(request.nextUrl.searchParams.get("streams"));
  if (!parsed) return new Response("Invalid streams", { status: 400 });
  const user = await getCurrentUser().catch(() => null);
  const userId = user?.id ?? null;
  const encoder = new TextEncoder();
  let unsubscribes = [];
  let heartbeat = null;

  const stream = new ReadableStream({
    start(controller) {
      const closed = () => {
        clearInterval(heartbeat);
        unsubscribes.forEach((unsubscribe) => unsubscribe());
        unsubscribes = [];
        try {
          controller.close();
        } catch {}
      };
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          closed();
        }
      }, HEARTBEAT_MS);
      let queue = Promise.resolve();
      const forward = async (entry, data) => {
        if (!unsubscribes.length) return;
        let payload = data;
        try {
          payload = await transformMessage(userId, entry, data);
        } catch (error) {
          console.error(`Overlay transform for ${entry.stream} failed:`, error);
        }
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stream: entry.stream, data: payload })}\n\n`));
        } catch {
          closed();
        }
      };
      unsubscribes = parsed.map((entry) =>
        subscribeUpstream(entry.stream, (data) => {
          queue = queue.then(() => forward(entry, data));
        }),
      );
      request.signal.addEventListener("abort", closed);
    },
    cancel() {
      clearInterval(heartbeat);
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      unsubscribes = [];
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};
