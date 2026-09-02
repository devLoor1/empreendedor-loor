export type PwaProductType = "investor" | "entrepreneur";

export type PwaEnvironment = Partial<
  Record<
    | "VITE_APP_LOGO_URL"
    | "VITE_APP_THEME_COLOR"
    | "VITE_PLATFORM_SLUG"
    | "VITE_API_SLUG"
    | "VITE_PWA_BRAND"
    | "VITE_PWA_BRAND_NAME"
    | "VITE_PWA_NAME"
    | "VITE_PWA_SHORT_NAME"
    | "VITE_PWA_THEME_COLOR"
    | "VITE_PWA_BACKGROUND_COLOR"
    | "VITE_PWA_LOGO"
    | "VITE_PWA_ICON_192"
    | "VITE_PWA_ICON_512"
    | "VITE_PWA_ICON_MASKABLE"
    | "VITE_PWA_APPLE_TOUCH_ICON"
    | "VITE_PWA_ID"
    | "VITE_PWA_START_URL"
    | "VITE_PWA_SCOPE"
    | "VITE_PWA_ANDROID_TUTORIAL_WEBM"
    | "VITE_PWA_ANDROID_TUTORIAL_MP4"
    | "VITE_PWA_ANDROID_TUTORIAL_POSTER"
    | "VITE_PWA_APPLE_TUTORIAL_WEBM"
    | "VITE_PWA_APPLE_TUTORIAL_MP4"
    | "VITE_PWA_APPLE_TUTORIAL_POSTER",
    string | undefined
  >
>;

export type PwaTutorialMedia = {
  webm?: string;
  mp4?: string;
  poster?: string;
};

export type PwaBrandConfig = {
  productType: PwaProductType;
  platformSlug?: string;
  brandKey: string;
  brandName: string;
  name: string;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
  id: string;
  startUrl: string;
  scope: string;
  logo: string;
  icons: {
    icon192: string;
    icon512: string;
    maskable512: string;
    appleTouchIcon: string;
  };
  tutorialMedia: {
    android: PwaTutorialMedia;
    apple: PwaTutorialMedia;
  };
};

type BrandPreset = {
  displayName: string;
  themeColor: string;
  backgroundColor: string;
};

const BRAND_PRESETS: Record<string, BrandPreset> = {
  loor: {
    displayName: "LOOR",
    themeColor: "#1A1AFF",
    backgroundColor: "#FFFFFF",
  },
  finapop: {
    displayName: "Finapop",
    themeColor: "#0A871F",
    backgroundColor: "#FFFFFF",
  },
};

const PRODUCT_DEFAULTS: Record<
  PwaProductType,
  { label: string; shortSuffix: string; id: string; startUrl: string; scope: string }
> = {
  investor: {
    label: "Investidor",
    shortSuffix: "",
    id: "/wallet",
    startUrl: "/wallet",
    scope: "/",
  },
  entrepreneur: {
    label: "Empreendedor",
    shortSuffix: " Emp.",
    id: "/app",
    startUrl: "/app",
    scope: "/",
  },
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function value(raw?: string): string | undefined {
  const normalized = raw?.replace(/^['"]|['"]$/g, "").trim();
  return normalized || undefined;
}

function color(raw: string | undefined, fallback: string): string {
  const normalized = value(raw);
  return normalized && HEX_COLOR.test(normalized) ? normalized.toUpperCase() : fallback;
}

function inferBrandKey(env: PwaEnvironment): string {
  const explicit = value(env.VITE_PWA_BRAND)?.toLowerCase();
  if (explicit && /^[a-z0-9-]+$/.test(explicit)) return explicit;

  const slug = value(env.VITE_PLATFORM_SLUG) ?? value(env.VITE_API_SLUG);
  return slug?.toLowerCase().includes("finapop") ? "finapop" : "loor";
}

function tutorialMedia(webm?: string, mp4?: string, poster?: string): PwaTutorialMedia {
  return {
    ...(value(webm) ? { webm: value(webm) } : {}),
    ...(value(mp4) ? { mp4: value(mp4) } : {}),
    ...(value(poster) ? { poster: value(poster) } : {}),
  };
}

export function resolvePwaBrandConfig(
  env: PwaEnvironment,
  productType: PwaProductType,
): PwaBrandConfig {
  const product = PRODUCT_DEFAULTS[productType];
  const brandKey = inferBrandKey(env);
  const preset = BRAND_PRESETS[brandKey] ?? BRAND_PRESETS.loor;
  const brandName = value(env.VITE_PWA_BRAND_NAME) ?? preset.displayName;
  const iconBase = `/pwa/${brandKey}`;

  return {
    productType,
    platformSlug: value(env.VITE_PLATFORM_SLUG) ?? value(env.VITE_API_SLUG),
    brandKey,
    brandName,
    name: value(env.VITE_PWA_NAME) ?? `${brandName} ${product.label}`,
    shortName: value(env.VITE_PWA_SHORT_NAME) ?? `${brandName}${product.shortSuffix}`,
    themeColor: color(env.VITE_PWA_THEME_COLOR ?? env.VITE_APP_THEME_COLOR, preset.themeColor),
    backgroundColor: color(env.VITE_PWA_BACKGROUND_COLOR, preset.backgroundColor),
    id: value(env.VITE_PWA_ID) ?? product.id,
    startUrl: value(env.VITE_PWA_START_URL) ?? product.startUrl,
    scope: value(env.VITE_PWA_SCOPE) ?? product.scope,
    logo: value(env.VITE_PWA_LOGO) ?? `${iconBase}/logo.png`,
    icons: {
      icon192: value(env.VITE_PWA_ICON_192) ?? `${iconBase}/icon-192.png`,
      icon512: value(env.VITE_PWA_ICON_512) ?? `${iconBase}/icon-512.png`,
      maskable512: value(env.VITE_PWA_ICON_MASKABLE) ?? `${iconBase}/icon-512-maskable.png`,
      appleTouchIcon: value(env.VITE_PWA_APPLE_TOUCH_ICON) ?? `${iconBase}/apple-touch-icon.png`,
    },
    tutorialMedia: {
      android: tutorialMedia(
        env.VITE_PWA_ANDROID_TUTORIAL_WEBM,
        env.VITE_PWA_ANDROID_TUTORIAL_MP4,
        env.VITE_PWA_ANDROID_TUTORIAL_POSTER,
      ),
      apple: tutorialMedia(
        env.VITE_PWA_APPLE_TUTORIAL_WEBM,
        env.VITE_PWA_APPLE_TUTORIAL_MP4,
        env.VITE_PWA_APPLE_TUTORIAL_POSTER,
      ),
    },
  };
}

export function buildWebAppManifest(config: PwaBrandConfig) {
  return {
    id: config.id,
    name: config.name,
    short_name: config.shortName,
    description: `${config.name} instalado no seu dispositivo.`,
    lang: "pt-BR",
    start_url: config.startUrl,
    scope: config.scope,
    display: "standalone",
    theme_color: config.themeColor,
    background_color: config.backgroundColor,
    prefer_related_applications: false,
    icons: [
      {
        src: config.icons.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: config.icons.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: config.icons.maskable512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
