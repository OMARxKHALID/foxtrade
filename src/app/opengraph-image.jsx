import { ImageResponse } from "next/og";
import { getPlatformSettings } from "@/lib/cached-settings";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export const alt = "Foxtrade — practice crypto trading with live market data";

const OpengraphImage = async () => {
  const { siteName, tagline, description } = await getPlatformSettings();

  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-between bg-black p-20" style={{ backgroundImage: "linear-gradient(135deg, #0a0a0a 0%, #1a0f08 55%, #2a1206 100%)" }}>
        <div tw="flex items-center">
          <svg width="76" height="65" viewBox="0 0 28 24" fill="none">
            <path d="M8 3 3 21M15 3l-5 18M22 3l-5 18" stroke="#ff6a2a" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div tw="ml-6 text-5xl font-bold text-white">{siteName}</div>
        </div>
        <div tw="flex flex-col">
          <div tw="text-7xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>{tagline}</div>
          <div tw="mt-6 max-w-4xl text-3xl text-neutral-400">{description}</div>
        </div>
        <div tw="flex items-center text-2xl text-neutral-500">
          <div tw="flex rounded-full bg-[#ff6a2a] px-5 py-2 text-white">Demo trading</div>
          <div tw="ml-5">Live Binance market data · No real money</div>
        </div>
      </div>
    ),
    size,
  );
};

export default OpengraphImage;
