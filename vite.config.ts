import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { resolvePwaBrandConfig, type PwaEnvironment } from "./src/features/pwa/pwaConfig";
import { createPwaPlugin } from "./src/features/pwa/vitePwaPlugin";

export default defineConfig(({ mode }) => {
  const pwaEnvironment = {
    ...loadEnv(mode, __dirname, ""),
    ...process.env,
  } as PwaEnvironment;
  const pwaConfig = resolvePwaBrandConfig(pwaEnvironment, "entrepreneur");

  return {
    plugins: [react(), createPwaPlugin(pwaConfig), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 8080,
      host: true,
    },
  };
});
