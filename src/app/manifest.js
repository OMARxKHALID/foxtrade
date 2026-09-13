import { site } from "@/lib/site";

const manifest = () => ({
  name: site.name,
  short_name: site.name,
  description: site.description,
  start_url: "/",
  display: "standalone",
  background_color: "#000000",
  theme_color: "#000000",
  icons: [
    { src: "/icons/192", sizes: "192x192", type: "image/png" },
    { src: "/icons/512", sizes: "512x512", type: "image/png" },
    { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
});

export default manifest;
