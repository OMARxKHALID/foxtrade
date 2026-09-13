import { Inter, Inter_Tight } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#000000",
};

const RootLayout = ({ children }) => (
  <html lang="en" className={`${inter.variable} ${interTight.variable} h-full antialiased`}>
    <body className="flex min-h-full flex-col overflow-x-hidden">
      <AppProviders>{children}</AppProviders>
    </body>
  </html>
);

export default RootLayout;
