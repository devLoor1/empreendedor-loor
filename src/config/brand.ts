const fallbackLogoUrl = "/loor-logo.png";

const configuredLogoUrl = import.meta.env.VITE_APP_LOGO_URL?.trim();

let runtimeLogoUrl: string | null = null;
let runtimeBrandName: string | null = null;
let suppressDefaultLogo = false;

export function setRuntimeLogoUrl(url: string | null | undefined) {
  const trimmed = url?.trim();
  runtimeLogoUrl = trimmed || null;
}

export function setRuntimeBrandName(name: string | null | undefined) {
  const trimmed = name?.trim();
  runtimeBrandName = trimmed || null;
}

export function setSuppressDefaultLogo(value: boolean) {
  suppressDefaultLogo = value;
}

export function getRuntimeBrandName(): string | null {
  return runtimeBrandName;
}

export function getAppLogoUrl(): string {
  if (runtimeLogoUrl) return runtimeLogoUrl;
  if (suppressDefaultLogo) return "";
  return configuredLogoUrl || fallbackLogoUrl;
}

/** @deprecated Prefer getAppLogoUrl() after bootstrap. */
export const appLogoUrl = configuredLogoUrl || fallbackLogoUrl;
export const appLogoAlt = "Logo da plataforma";
