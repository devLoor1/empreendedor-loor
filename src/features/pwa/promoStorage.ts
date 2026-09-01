export const INSTALL_PROMO_VERSION = "v1";
export const INSTALL_PROMO_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function installPromoStorageKey(hostname: string): string {
  return `PWA_INSTALL_PROMO:${INSTALL_PROMO_VERSION}:${hostname.toLowerCase()}`;
}

export function isInstallPromoDismissed(
  storage: StorageLike,
  hostname: string,
  now = Date.now(),
): boolean {
  const key = installPromoStorageKey(hostname);

  try {
    const dismissedUntil = Number(storage.getItem(key));
    if (Number.isFinite(dismissedUntil) && dismissedUntil > now) return true;
    storage.removeItem(key);
  } catch {
    // Storage may be blocked; promotion remains available for this session.
  }

  return false;
}

export function dismissInstallPromo(
  storage: StorageLike,
  hostname: string,
  now = Date.now(),
): void {
  try {
    storage.setItem(installPromoStorageKey(hostname), String(now + INSTALL_PROMO_TTL_MS));
  } catch {
    // Closing still hides the in-memory banner even when storage is unavailable.
  }
}

export function clearInstallPromo(storage: StorageLike, hostname: string): void {
  try {
    storage.removeItem(installPromoStorageKey(hostname));
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}
