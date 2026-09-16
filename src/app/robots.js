import { absoluteUrl } from "@/lib/site-url";

const robots = () => ({
  rules: {
    userAgent: "*",
    allow: "/",
    disallow: ["/admin", "/account", "/assets", "/dashboard", "/api/", "/support/tickets"],
  },
  sitemap: absoluteUrl("/sitemap.xml"),
});

export default robots;
