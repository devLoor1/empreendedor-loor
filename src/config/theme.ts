const defaultThemeColor = "#0a871f";

function normalizeHexColor(raw?: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/['"]/g, "").trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(cleaned)) return cleaned;
  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export const appThemeColor =
  normalizeHexColor(import.meta.env.VITE_APP_THEME_COLOR) ?? defaultThemeColor;

export function applyThemeColor(root: HTMLElement = document.documentElement) {
  const rgb = hexToRgb(appThemeColor);
  if (!rgb) return;

  root.style.setProperty("--app-theme-color", appThemeColor);
  root.style.setProperty("--app-theme-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
}
