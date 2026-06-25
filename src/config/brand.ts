const fallbackLogoUrl = "/loor-logo.png";

const configuredLogoUrl = import.meta.env.VITE_APP_LOGO_URL?.trim();

export const appLogoUrl = configuredLogoUrl || fallbackLogoUrl;
export const appLogoAlt = "LOOR";
