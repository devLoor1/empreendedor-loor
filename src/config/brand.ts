const fallbackLogoUrl = "/loor-logo.png";

const configuredLogoUrl = import.meta.env.VITE_APP_LOGO_URL?.trim();

let runtimeLogoUrl: string | null = null;

export function setRuntimeLogoUrl(url: string | null | undefined) {
  const trimmed = url?.trim();
  runtimeLogoUrl = trimmed || null;
}

export function getAppLogoUrl(): string {
  return runtimeLogoUrl || configuredLogoUrl || fallbackLogoUrl;
}

/** @deprecated Prefer getAppLogoUrl() after bootstrap. */
export const appLogoUrl = configuredLogoUrl || fallbackLogoUrl;
export const appLogoAlt = "LOOR";
