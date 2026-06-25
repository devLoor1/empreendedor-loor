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

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function hexToOklch(hex: string): { l: number; c: number; h: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = srgbToLinear(rgb.r / 255);
  const g = srgbToLinear(rgb.g / 255);
  const b = srgbToLinear(rgb.b / 255);

  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l1 = Math.cbrt(l_);
  const m1 = Math.cbrt(m_);
  const s1 = Math.cbrt(s_);

  const L = 0.2104542553 * l1 + 0.7936177850 * m1 - 0.0040720468 * s1;
  const a = 1.9779984951 * l1 - 2.4285922050 * m1 + 0.4505937099 * s1;
  const bOk = 0.0259040371 * l1 + 0.7827717662 * m1 - 0.8086757660 * s1;

  const C = Math.sqrt(a * a + bOk * bOk);
  let H = (Math.atan2(bOk, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: L, c: C, h: H };
}

function oklchStr(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

export const appThemeColor =
  normalizeHexColor(import.meta.env.VITE_APP_THEME_COLOR) ?? defaultThemeColor;

export function applyThemeColor(root: HTMLElement = document.documentElement) {
  const rgb = hexToRgb(appThemeColor);
  const oklch = hexToOklch(appThemeColor);
  if (!rgb || !oklch) return;

  const { l, c, h } = oklch;

  root.style.setProperty("--app-theme-color", appThemeColor);
  root.style.setProperty("--app-theme-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);

  // Primary color and variants
  const primary = oklchStr(l, c, h);
  const primaryGlow = oklchStr(Math.min(l + 0.14, 0.95), Math.min(c + 0.01, 0.3), h - 5);
  const primaryFg = oklchStr(0.99, 0.005, h);

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-glow", primaryGlow);
  root.style.setProperty("--primary-foreground", primaryFg);
  root.style.setProperty("--ring", primary);

  // Accent derived from primary
  root.style.setProperty("--accent", oklchStr(Math.min(l + 0.36, 0.96), Math.max(c - 0.09, 0.02), h));
  root.style.setProperty("--accent-foreground", oklchStr(Math.max(l - 0.33, 0.15), Math.min(c + 0.02, 0.3), h));

  // Gradients and shadows
  root.style.setProperty("--gradient-primary", `linear-gradient(135deg, ${primary}, ${primaryGlow})`);
  root.style.setProperty("--shadow-elegant", `0 10px 30px -10px oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)} / 0.25)`);
}
