import { buildWebAppManifest, resolvePwaBrandConfig } from "./pwaConfig";
import { detectInstallPlatform, isAppleSafariContext } from "./installEnvironment";
import {
  dismissInstallPromo,
  installPromoStorageKey,
  isInstallPromoDismissed,
} from "./promoStorage";

function assertCondition(condition: unknown, message = "PWA assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

const assert = {
  equal(actual: unknown, expected: unknown) {
    assertCondition(
      actual === expected,
      `Expected ${String(expected)}, received ${String(actual)}`,
    );
  },

  notEqual(actual: unknown, expected: unknown) {
    assertCondition(actual !== expected, `Expected values to differ: ${String(actual)}`);
  },
};

const loorInvestor = resolvePwaBrandConfig({}, "investor");
assert.equal(loorInvestor.name, "LOOR Investidor");
assert.equal(loorInvestor.shortName, "LOOR");
assert.equal(loorInvestor.id, "/wallet");
assert.equal(loorInvestor.startUrl, "/wallet");
assert.equal(loorInvestor.scope, "/");
assert.equal(loorInvestor.logo, "/pwa/loor/logo.png");
assert.equal(loorInvestor.icons.icon192, "/pwa/loor/icon-192.png");

const finapopInvestor = resolvePwaBrandConfig(
  { VITE_PLATFORM_SLUG: "finapop-homologacao", VITE_APP_THEME_COLOR: "#0a871f" },
  "investor",
);
assert.equal(finapopInvestor.brandName, "Finapop");
assert.equal(finapopInvestor.name, "Finapop Investidor");
assert.equal(finapopInvestor.themeColor, "#0A871F");
assert.equal(finapopInvestor.logo, "/pwa/finapop/logo.png");
assert.equal(finapopInvestor.icons.icon512, "/pwa/finapop/icon-512.png");

const finapopEntrepreneur = resolvePwaBrandConfig(
  { VITE_PWA_BRAND: "finapop", VITE_API_SLUG: "finapop-homologacao" },
  "entrepreneur",
);
assert.equal(finapopEntrepreneur.name, "Finapop Empreendedor");
assert.equal(finapopEntrepreneur.shortName, "Finapop Emp.");
assert.equal(finapopEntrepreneur.id, "/app");
assert.equal(finapopEntrepreneur.startUrl, "/app");

const overridden = resolvePwaBrandConfig(
  {
    VITE_PWA_BRAND: "partner",
    VITE_PWA_BRAND_NAME: "Parceiro",
    VITE_PWA_NAME: "Aplicativo Parceiro",
    VITE_PWA_LOGO: "/brand/logo.png",
    VITE_PWA_ICON_192: "/brand/icon.png",
  },
  "investor",
);
assert.equal(overridden.brandName, "Parceiro");
assert.equal(overridden.name, "Aplicativo Parceiro");
assert.equal(overridden.logo, "/brand/logo.png");
assert.equal(overridden.icons.icon192, "/brand/icon.png");

const manifest = buildWebAppManifest(finapopInvestor);
assert.equal(manifest.display, "standalone");
assert.equal(manifest.prefer_related_applications, false);
assert.equal(manifest.icons[2].purpose, "maskable");

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};
const now = 1_000;
dismissInstallPromo(storage, "loor.vc", now);
assert.equal(isInstallPromoDismissed(storage, "loor.vc", now + 1), true);
assert.equal(isInstallPromoDismissed(storage, "finapop.investidor.loor.vc", now + 1), false);
assert.notEqual(
  installPromoStorageKey("loor.vc"),
  installPromoStorageKey("finapop.investidor.loor.vc"),
);
assert.equal(isInstallPromoDismissed(storage, "loor.vc", now + 31 * 24 * 60 * 60 * 1000), false);

const android = {
  userAgent: "Mozilla/5.0 (Linux; Android 15)",
  platform: "Linux armv8l",
  maxTouchPoints: 5,
} as unknown as Parameters<typeof detectInstallPlatform>[0];
assert.equal(detectInstallPlatform(android), "android");

const ipadSafari = {
  userAgent: "Mozilla/5.0 (Macintosh) Version/18.0 Mobile/15E148 Safari/604.1",
  platform: "MacIntel",
  maxTouchPoints: 5,
} as unknown as Parameters<typeof detectInstallPlatform>[0];
assert.equal(detectInstallPlatform(ipadSafari), "apple");
assert.equal(isAppleSafariContext(ipadSafari), true);

const iosChrome = {
  userAgent: "Mozilla/5.0 (iPhone) CriOS/140.0 Mobile/15E148 Safari/604.1",
  platform: "iPhone",
  maxTouchPoints: 5,
} as unknown as Parameters<typeof detectInstallPlatform>[0];
assert.equal(detectInstallPlatform(iosChrome), "apple");
assert.equal(isAppleSafariContext(iosChrome), false);

console.log("pwa: build identity, install environment, and dismissal assertions passed");
