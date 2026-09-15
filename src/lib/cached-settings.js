import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { readContent } from "@/lib/content/page-content";
import { readPairs } from "@/lib/market/pair-store";
import { readPlatformSettings } from "@/lib/platform-settings";

export const settingsTags = { platform: "platform-settings", pairs: "pairs", content: "page-content" };

export const getPlatformSettings = async () => {
  "use cache";
  cacheTag(settingsTags.platform);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return readPlatformSettings();
};

export const getPairs = async () => {
  "use cache";
  cacheTag(settingsTags.pairs);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return readPairs();
};

export const getContent = async (key) => {
  "use cache";
  cacheTag(settingsTags.content);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return readContent(key);
};
