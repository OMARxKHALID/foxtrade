import { AppProviders } from "@/providers/app-providers";
import { getPairs, getPlatformSettings } from "@/lib/cached-settings";
import { fontVariables } from "@/lib/fonts";
import { PlatformProvider } from "@/providers/platform-provider";
import "./globals.css";

export const generateMetadata = async () => {
  const { siteName, tagline, description } = await getPlatformSettings();
  return {
    title: {
      default: `${siteName} — ${tagline}`,
      template: `%s · ${siteName}`,
    },
    description,
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "black-translucent",
    },
  };
};

export const viewport = {
  themeColor: "#000000",
};

const RootLayout = async ({ children }) => {
  const [settings, pairs] = await Promise.all([getPlatformSettings(), getPairs()]);

  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <PlatformProvider settings={settings} pairs={pairs}>
          <AppProviders>{children}</AppProviders>
        </PlatformProvider>
      </body>
    </html>
  );
};

export default RootLayout;
