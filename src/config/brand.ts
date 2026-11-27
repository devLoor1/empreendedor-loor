const fallbackLogoUrl = "/loor-logo.png";

const configuredLogoUrl = import.meta.env.VITE_APP_LOGO_URL?.trim();

let runtimeLogoUrl: string | null = null;
let runtimeBrandName: string | null = null;
let suppressDefaultLogo = false;
let runtimeLogoOnDark: boolean | null = null;

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

export function setRuntimeLogoOnDark(value: boolean | null | undefined) {
  runtimeLogoOnDark = typeof value === "boolean" ? value : null;
}

export function getRuntimeBrandName(): string | null {
  return runtimeBrandName;
}

export function getAppLogoUrl(): string {
  if (runtimeLogoUrl) return runtimeLogoUrl;
  if (suppressDefaultLogo) return "";
  return configuredLogoUrl || fallbackLogoUrl;
}

/** Light logo on dark panels — drop the white pill behind the img. */
export function getAppLogoOnDark(): boolean {
  if (runtimeLogoOnDark !== null) return runtimeLogoOnDark;
  return import.meta.env.VITE_APP_LOGO_ON_DARK?.trim().toLowerCase() === "true";
}

/** @deprecated Prefer getAppLogoUrl() after bootstrap. */
export const appLogoUrl = configuredLogoUrl || fallbackLogoUrl;
export const appLogoAlt = "Logo da plataforma";
