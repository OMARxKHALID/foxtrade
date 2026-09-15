"use client";

import { useEffect, useState } from "react";
import { CircleCheck, Download, Smartphone } from "lucide-react";
import { CardBody, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { IconTile } from "@/components/ui/icon-tile";
import { usePlatform } from "@/hooks/use-platform";

export const InstallCard = () => {
  const { siteName } = usePlatform().settings;
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handlePrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    const standalone = window.matchMedia("(display-mode: standalone)");
    const handleDisplayMode = () => setInstalled(standalone.matches);
    handleDisplayMode();
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    standalone.addEventListener("change", handleDisplayMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      standalone.removeEventListener("change", handleDisplayMode);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  };

  return (
    <GlowCard variant="warm">
      <CardBody className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <IconTile icon={Smartphone} size="lg" />
          <div className="max-w-xl">
            <h2 className="font-heading text-2xl font-bold text-white">Install {siteName}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Add {siteName} to your home screen or desktop. It opens full screen like a native app, with no app store and no configuration profiles.
            </p>
          </div>
        </div>
        {installed ? (
          <p className="flex items-center gap-2 text-sm text-up">
            <CircleCheck className="size-4" />
            Installed on this device
          </p>
        ) : (
          <div className="flex flex-col items-start gap-2 md:items-end">
            <GradientButton onClick={handleInstall} disabled={!promptEvent}>
              <Download className="size-4" />
              Install App
            </GradientButton>
            {!promptEvent && <p className="text-xs text-neutral-500">Not offered by this browser. Use the steps below.</p>}
          </div>
        )}
      </CardBody>
    </GlowCard>
  );
};
