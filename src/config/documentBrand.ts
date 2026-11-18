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
