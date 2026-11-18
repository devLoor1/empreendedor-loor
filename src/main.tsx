import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { applyThemeColor } from "./config/theme";
import { getBootstrapBranding, initTenant } from "./config/tenant";
import { setRuntimeLogoUrl } from "./config/brand";
import App from "./App";
import "./styles.css";

async function boot() {
  const rootEl = document.getElementById("root")!;
  try {
    await initTenant();
    const branding = getBootstrapBranding();
    if (branding?.logoUrl) setRuntimeLogoUrl(branding.logoUrl);
    applyThemeColor(undefined, branding?.primaryColor ?? undefined);
    const queryClient = new QueryClient();
    createRoot(rootEl).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </StrictMode>,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao iniciar a plataforma.";
    rootEl.innerHTML = `<main style="font-family:system-ui;padding:2rem;max-width:36rem"><h1>Plataforma indisponível</h1><p>${message}</p></main>`;
  }
}

void boot();
