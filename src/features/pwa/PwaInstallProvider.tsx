import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { isStandaloneDisplayMode } from "./installEnvironment";
import { clearInstallPromo } from "./promoStorage";
import { PwaInstallContext, type InstallChoice } from "./usePwaInstall";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [installed, setInstalled] = useState(() => isStandaloneDisplayMode());

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateDisplayMode = () => setInstalled(isStandaloneDisplayMode());
    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as DeferredInstallPrompt;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
    };
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
      clearInstallPromo(window.localStorage, window.location.hostname);
    };

    displayMode.addEventListener?.("change", updateDisplayMode);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      displayMode.removeEventListener?.("change", updateDisplayMode);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallChoice> => {
    if (!deferredPrompt) return "unavailable";

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome;
  }, [deferredPrompt]);

  const contextValue = useMemo(
    () => ({ canPrompt: deferredPrompt !== null, installed, promptInstall }),
    [deferredPrompt, installed, promptInstall],
  );

  return <PwaInstallContext.Provider value={contextValue}>{children}</PwaInstallContext.Provider>;
}
