/** Apply tenant chrome that HTML/build-time assets cannot know at compile time. */

export function applyDocumentFavicon(url: string | null | undefined) {
  const href = url?.trim();
  if (!href || typeof document === "undefined") return;

  const ensure = (rel: string) => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
  };

  ensure("icon");
  ensure("shortcut icon");
}

export function applyDocumentTitle(title: string | null | undefined) {
  const next = title?.trim();
  if (!next || typeof document === "undefined") return;
  document.title = next;
}

function setMeta(
  selector: string,
  value: string,
  create?: { name?: string; property?: string },
) {
  if (typeof document === "undefined") return;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el && create) {
    el = document.createElement("meta");
    if (create.name) el.setAttribute("name", create.name);
    if (create.property) el.setAttribute("property", create.property);
    document.head.appendChild(el);
  }
  if (el) el.setAttribute("content", value);
}

/** Sync tab/PWA/share metadata with the resolved Whitelabel name. */
export function applyDocumentMetadata(opts: {
  title: string;
  siteName: string;
  description?: string;
}) {
  if (typeof document === "undefined") return;
  const title = opts.title.trim();
  const siteName = opts.siteName.trim();
  if (!title || !siteName) return;

  applyDocumentTitle(title);

  setMeta('meta[name="application-name"]', siteName, { name: "application-name" });
  setMeta('meta[name="apple-mobile-web-app-title"]', siteName, {
    name: "apple-mobile-web-app-title",
  });
  setMeta('meta[property="og:site_name"]', siteName, { property: "og:site_name" });
  setMeta('meta[property="og:title"]', title, { property: "og:title" });
  setMeta('meta[name="twitter:title"]', title, { name: "twitter:title" });
  if (opts.description?.trim()) {
    setMeta('meta[name="description"]', opts.description.trim());
  }
}

/** High-priority warm for above-the-fold brand mark. */
export function preloadBrandImage(url: string | null | undefined) {
  const href = url?.trim();
  if (!href || typeof document === "undefined") return;

  const already = Array.from(document.querySelectorAll('link[rel="preload"][as="image"]')).some(
    (node) => (node as HTMLLinkElement).href === href || node.getAttribute("href") === href,
  );
  if (!already) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
  }

  const img = new Image();
  img.decoding = "async";
  img.src = href;
}

/** Tiny letter mark when the tenant has no dedicated logo_url (hero banners are not logos). */
export function applyLetterFavicon(name: string, backgroundHex: string) {
  if (typeof document === "undefined") return;
  const letter = (name.trim().charAt(0) || "?").toUpperCase();
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = backgroundHex || "#7c3aed";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px system-ui, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 32, 34);
  applyDocumentFavicon(canvas.toDataURL("image/png"));
}
