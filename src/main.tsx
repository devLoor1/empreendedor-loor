import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { applyThemeColor } from "./config/theme";
import {
  getBootstrapBranding,
  getBootstrapHero,
  getTenantName,
  initTenant,
  tenantRouterBasename,
} from "./config/tenant";
import {
  setRuntimeBrandName,
  setRuntimeLogoUrl,
  setSuppressDefaultLogo,
} from "./config/brand";
import {
  applyDocumentFavicon,
  applyDocumentTitle,
  applyLetterFavicon,
} from "./config/documentBrand";
import App from "./App";
import "./styles.css";

async function boot() {
  const rootEl = document.getElementById("root")!;
  try {
    const tenant = await initTenant();
    const branding = getBootstrapBranding();
    const heroUrl = getBootstrapHero()?.url?.trim() || null;
    const logoUrl = branding?.logoUrl?.trim() || heroUrl || null;
    const primary = branding?.primaryColor?.trim() || "#7c3aed";
    const name = getTenantName();

    setRuntimeBrandName(name);
    if (logoUrl) {
      setRuntimeLogoUrl(logoUrl);
      applyDocumentFavicon(logoUrl);
    } else if (tenant.id || tenant.source === "path" || tenant.source === "hostname") {
      setSuppressDefaultLogo(true);
      applyLetterFavicon(name, primary);
    }

    applyThemeColor(undefined, primary);
    applyDocumentTitle(`${name} — Empreendedor`);

    const queryClient = new QueryClient();
    createRoot(rootEl).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={tenantRouterBasename()}>
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
