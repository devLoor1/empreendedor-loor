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
