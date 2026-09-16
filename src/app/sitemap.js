import { getPairs } from "@/lib/cached-settings";
import { getPublishedNotices } from "@/lib/content-store";
import { documentsInGroup } from "@/lib/content/content-registry";
import { absoluteUrl } from "@/lib/site-url";

const entry = (path, priority, changeFrequency, lastModified = new Date()) => ({
  url: absoluteUrl(path),
  lastModified,
  changeFrequency,
  priority,
});

const sitemap = async () => {
  const [pairs, notices] = await Promise.all([getPairs(), getPublishedNotices()]);
  const tradable = pairs.filter((pair) => pair.timedEnabled || pair.perpetualEnabled);

  return [
    entry("/", 1, "hourly"),
    entry("/markets", 0.9, "hourly"),
    entry("/about", 0.6, "monthly"),
    entry("/help", 0.6, "monthly"),
    entry("/copy-trading", 0.6, "daily"),
    entry("/download", 0.5, "monthly"),
    entry("/notices", 0.5, "daily"),
    entry("/support", 0.4, "monthly"),
    entry("/register", 0.7, "monthly"),
    entry("/login", 0.3, "monthly"),
    ...["timed", "perpetual"].map((market) => entry(`/trade/rules/${market}`, 0.5, "monthly")),
    ...documentsInGroup("Legal").map((doc) => entry(`/legal/${doc.slug}`, 0.4, "yearly")),
    ...tradable.filter((pair) => pair.perpetualEnabled).map((pair) => entry(`/trade/perpetual/${pair.symbol.toLowerCase()}`, 0.8, "hourly")),
    ...tradable.filter((pair) => pair.timedEnabled).map((pair) => entry(`/trade/timed/${pair.symbol.toLowerCase()}`, 0.8, "hourly")),
    ...notices.map((notice) => entry(`/notices/${notice.slug}`, 0.3, "weekly", new Date(notice.date))),
  ];
};

export default sitemap;
