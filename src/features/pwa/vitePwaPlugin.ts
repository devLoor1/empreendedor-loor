import type { Plugin } from "vite";
import { buildWebAppManifest, type PwaBrandConfig } from "./pwaConfig";

export function createPwaPlugin(config: PwaBrandConfig): Plugin {
  const manifest = `${JSON.stringify(buildWebAppManifest(config), null, 2)}\n`;

  return {
    name: "loor-pwa-manifest",
    transformIndexHtml: {
      order: "post",
      handler: () => [
        {
          tag: "link",
          attrs: { rel: "manifest", href: "/manifest.webmanifest" },
          injectTo: "head",
        },
        {
          tag: "link",
          attrs: {
            rel: "apple-touch-icon",
            sizes: "180x180",
            href: config.icons.appleTouchIcon,
          },
          injectTo: "head",
        },
        {
          tag: "link",
          attrs: {
            rel: "icon",
            type: "image/png",
            sizes: "192x192",
            href: config.icons.icon192,
          },
          injectTo: "head",
        },
        {
          tag: "meta",
          attrs: { name: "theme-color", content: config.themeColor },
          injectTo: "head",
        },
        {
          tag: "meta",
          attrs: { name: "application-name", content: config.shortName },
          injectTo: "head",
        },
        {
          tag: "meta",
          attrs: { name: "mobile-web-app-capable", content: "yes" },
          injectTo: "head",
        },
        {
          tag: "meta",
          attrs: { name: "apple-mobile-web-app-capable", content: "yes" },
          injectTo: "head",
        },
        {
          tag: "meta",
          attrs: {
            name: "apple-mobile-web-app-status-bar-style",
            content: "default",
          },
          injectTo: "head",
        },
        {
          tag: "meta",
          attrs: { name: "apple-mobile-web-app-title", content: config.shortName },
          injectTo: "head",
        },
      ],
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== "/manifest.webmanifest") {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.end(manifest);
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.webmanifest",
        source: manifest,
      });
    },
  };
}
