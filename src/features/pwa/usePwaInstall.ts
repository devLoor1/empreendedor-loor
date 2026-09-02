import { createContext, useContext } from "react";

export type InstallChoice = "accepted" | "dismissed" | "unavailable";

export type PwaInstallContextValue = {
  canPrompt: boolean;
  installed: boolean;
  promptInstall: () => Promise<InstallChoice>;
};

export const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function usePwaInstall(): PwaInstallContextValue {
  const value = useContext(PwaInstallContext);
  if (!value) {
    throw new Error("usePwaInstall must be used inside PwaInstallProvider");
  }
  return value;
}
