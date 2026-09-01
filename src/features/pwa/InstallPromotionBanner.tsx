import { Download, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { detectInstallPlatform } from "./installEnvironment";
import { usePwaInstall } from "./usePwaInstall";
import { dismissInstallPromo, isInstallPromoDismissed } from "./promoStorage";
import { runtimePwaConfig } from "./runtimePwaConfig";

const INSTALL_ROUTES = new Set(["/app-android", "/app-apple"]);

export function InstallPromotionBanner() {
  const location = useLocation();
  const { installed } = usePwaInstall();
  const platform = detectInstallPlatform();
  const [dismissed, setDismissed] = useState(() =>
    isInstallPromoDismissed(window.localStorage, window.location.hostname),
  );

  if (installed || dismissed || platform === "unknown" || INSTALL_ROUTES.has(location.pathname)) {
    return null;
  }

  const tutorialPath = platform === "apple" ? "/app-apple" : "/app-android";

  const handleDismiss = () => {
    dismissInstallPromo(window.localStorage, window.location.hostname);
    setDismissed(true);
  };

  return (
    <aside
      aria-label="Instalar aplicativo"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur sm:bottom-5 sm:p-4"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: runtimePwaConfig.themeColor }}
      >
        <Download className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          Baixe o aplicativo da {runtimePwaConfig.brandName} para o seu celular.
        </p>
        <Link
          to={tutorialPath}
          className="mt-1 inline-flex text-sm font-medium underline underline-offset-4"
          style={{ color: runtimePwaConfig.themeColor }}
        >
          Ver como instalar
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fechar promoção de instalação"
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
