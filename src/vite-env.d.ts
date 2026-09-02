/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_LOGO_URL?: string;
  readonly VITE_APP_THEME_COLOR?: string;
  readonly VITE_API_SLUG?: string;
  readonly VITE_PWA_BRAND?: string;
  readonly VITE_PWA_BRAND_NAME?: string;
  readonly VITE_PWA_NAME?: string;
  readonly VITE_PWA_SHORT_NAME?: string;
  readonly VITE_PWA_THEME_COLOR?: string;
  readonly VITE_PWA_BACKGROUND_COLOR?: string;
  readonly VITE_PWA_LOGO?: string;
  readonly VITE_PWA_ICON_192?: string;
  readonly VITE_PWA_ICON_512?: string;
  readonly VITE_PWA_ICON_MASKABLE?: string;
  readonly VITE_PWA_APPLE_TOUCH_ICON?: string;
  readonly VITE_PWA_ID?: string;
  readonly VITE_PWA_START_URL?: string;
  readonly VITE_PWA_SCOPE?: string;
  readonly VITE_PWA_ANDROID_TUTORIAL_WEBM?: string;
  readonly VITE_PWA_ANDROID_TUTORIAL_MP4?: string;
  readonly VITE_PWA_ANDROID_TUTORIAL_POSTER?: string;
  readonly VITE_PWA_APPLE_TUTORIAL_WEBM?: string;
  readonly VITE_PWA_APPLE_TUTORIAL_MP4?: string;
  readonly VITE_PWA_APPLE_TUTORIAL_POSTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
