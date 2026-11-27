import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { applyThemeColor } from "./config/theme";
import {
  getBootstrapBranding,
  getTenantName,
  initTenant,
  shouldHideDefaultLoorChrome,
  tenantRouterBasename,
} from "./config/tenant";
import {
  setRuntimeBrandName,
  setRuntimeLogoOnDark,
  setRuntimeLogoUrl,
  setSuppressDefaultLogo,
} from "./config/brand";
import {
  applyDocumentFavicon,
  applyDocumentMetadata,
  applyLetterFavicon,
  preloadBrandImage,
} from "./config/documentBrand";
import App from "./App";
import "./styles.css";

async function boot() {
  const rootEl = document.getElementById("root")!;
  try {
    const tenant = await initTenant();
    const branding = getBootstrapBranding();
    const hideDefaultLoor = shouldHideDefaultLoorChrome(tenant.source, tenant.slug);
    // Institutional logo only — hero/banner stays for login main area, not navbar.
    const logoUrl = branding?.logoUrl?.trim() || null;
    const primary = branding?.primaryColor?.trim() || undefined;
    const name = getTenantName() || tenant.name || tenant.slug;
    if (typeof branding?.logoOnDark === "boolean") {
      setRuntimeLogoOnDark(branding.logoOnDark);
    }

    // Only customer WLs replace LOOR chrome. Platform homolog keeps LOOR logo/title.
    if (hideDefaultLoor) {
      setRuntimeBrandName(name);
      setSuppressDefaultLogo(true);
      if (logoUrl) {
        setRuntimeLogoUrl(logoUrl);
        preloadBrandImage(logoUrl);
        applyDocumentFavicon(logoUrl);
      } else {
        applyLetterFavicon(name, primary || "#7c3aed");
      }
      applyDocumentMetadata({
        title: `${name} — Empreendedor`,
        siteName: name,
        description: `Painel do empreendedor · ${name}`,
      });
    } else if (logoUrl) {
      setRuntimeLogoUrl(logoUrl);
      preloadBrandImage(logoUrl);
      applyDocumentFavicon(logoUrl);
    }

    applyThemeColor(undefined, primary);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
        },
      },
    });
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
