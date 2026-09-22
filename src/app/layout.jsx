import { AppProviders } from "@/providers/app-providers";
import { getPairs, getPlatformSettings } from "@/lib/cached-settings";
import { fontVariables } from "@/lib/fonts";
import { siteUrl } from "@/lib/site-url";
import { PlatformProvider } from "@/providers/platform-provider";
import "./globals.css";

export const generateMetadata = async () => {
  const { siteName, tagline, description } = await getPlatformSettings();
  const title = `${siteName} — ${tagline}`;
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: title,
      template: `%s · ${siteName}`,
    },
    description,
    applicationName: siteName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName,
      title,
      description,
      url: "/",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "black-translucent",
    },
  };
};

export const viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
};

const RootLayout = async ({ children }) => {
  const [settings, pairs] = await Promise.all([getPlatformSettings(), getPairs()]);

  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        <PlatformProvider settings={settings} pairs={pairs}>
          <AppProviders>{children}</AppProviders>
        </PlatformProvider>
      </body>
    </html>
  );
};

export default RootLayout;
