export type InstallPlatform = "android" | "apple" | "unknown";

type NavigatorWithInstallSignals = Navigator & {
  standalone?: boolean;
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
  };
};

export function detectInstallPlatform(
  navigatorValue: NavigatorWithInstallSignals = navigator as NavigatorWithInstallSignals,
): InstallPlatform {
  const userAgent = navigatorValue.userAgent ?? "";
  const platform = navigatorValue.userAgentData?.platform ?? navigatorValue.platform ?? "";
  const appleMobile = /iPad|iPhone|iPod/i.test(userAgent);
  const ipadDesktopMode = platform === "MacIntel" && navigatorValue.maxTouchPoints > 1;

  if (appleMobile || ipadDesktopMode) return "apple";
  if (/Android/i.test(userAgent) || /Android/i.test(platform)) return "android";
  return "unknown";
}

export function isStandaloneDisplayMode(
  windowValue: Window = window,
  navigatorValue: NavigatorWithInstallSignals = navigator as NavigatorWithInstallSignals,
): boolean {
  return (
    windowValue.matchMedia("(display-mode: standalone)").matches ||
    navigatorValue.standalone === true
  );
}

export function isAppleSafariContext(
  navigatorValue: NavigatorWithInstallSignals = navigator as NavigatorWithInstallSignals,
): boolean {
  if (detectInstallPlatform(navigatorValue) !== "apple") return false;
  const userAgent = navigatorValue.userAgent ?? "";
  return /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(userAgent);
}
