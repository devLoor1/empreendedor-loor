/**
 * Runtime tenant for shared Entrepreneur builds.
 * Order: bootstrap → investor/platform → hostname → VITE_API_SLUG / VITE_PLATFORM_SLUG.
 */

export type PlatformBootstrap = {
  whitelabel: { id: number; slug: string; name: string }
  environment: "INVESTOR" | "ENTREPRENEUR" | "ADMIN" | null
  branding: {
    logoUrl: string | null
    primaryColor: string | null
    brandPanelTextColor: string | null
  }
}

type TenantState = {
  slug: string
  name: string
  id: number | null
  source: "bootstrap" | "platform" | "hostname" | "vite_fallback"
  bootstrap: PlatformBootstrap | null
}

let state: TenantState | null = null

const ROLE_SUFFIXES = [
  "investor.loor.vc",
  "investidor.loor.vc",
  "empresa.loor.vc",
  "admin.loor.vc",
  "empreendedor.loor.vc",
  "investor.localhost",
  "investidor.localhost",
  "empresa.localhost",
  "admin.localhost",
  "empreendedor.localhost",
] as const

function apiBase(): string {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== "undefined" && window.location.protocol === "https:"
      ? "https://back.loor.vc/service"
      : "http://127.0.0.1:3333")
  ).replace(/\/$/, "")
}

function viteFallbackSlug(): string | null {
  return (
    import.meta.env.VITE_API_SLUG?.trim() ||
    import.meta.env.VITE_PLATFORM_SLUG?.trim() ||
    null
  )
}

export function slugFromHostname(hostname: string): string | null {
  const host = hostname.trim().toLowerCase().split(":")[0]
  for (const suffix of ROLE_SUFFIXES) {
    const prefix = `.${suffix}`
    if (!host.endsWith(prefix)) continue
    const slug = host.slice(0, -prefix.length)
    if (!slug || slug === "www") return null
    return slug.split(".")[0] || null
  }
  return null
}

function brandingFromPages(pages: Record<string, unknown> | undefined): PlatformBootstrap["branding"] {
  const emailPage = pages?.email_branding as Record<string, unknown> | undefined
  const config = (emailPage?.config ?? emailPage) as Record<string, unknown> | undefined
  return {
    logoUrl:
      typeof config?.logo_url === "string"
        ? config.logo_url
        : typeof config?.logoUrl === "string"
          ? config.logoUrl
          : null,
    primaryColor:
      typeof config?.primary_color === "string"
        ? config.primary_color
        : typeof config?.primaryColor === "string"
          ? config.primaryColor
          : null,
    brandPanelTextColor: null,
  }
}

async function fetchJson(path: string, signal?: AbortSignal): Promise<unknown | null> {
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      signal,
    })
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

async function resolveFromApis(signal?: AbortSignal): Promise<PlatformBootstrap | null> {
  const boot = (await fetchJson("/public/platform/bootstrap", signal)) as {
    data?: PlatformBootstrap
  } | null
  if (boot?.data?.whitelabel?.slug) return boot.data

  const hostSlug =
    typeof window !== "undefined" ? slugFromHostname(window.location.hostname) : null
  const path = hostSlug
    ? `/investor/platform?platform_slug=${encodeURIComponent(hostSlug)}`
    : "/investor/platform"
  const platform = (await fetchJson(path, signal)) as { data?: Record<string, unknown> } | null
  const data = platform?.data
  const slug = typeof data?.slug === "string" ? data.slug.trim() : ""
  if (!slug) return null
  const pages =
    data.pages && typeof data.pages === "object" ? (data.pages as Record<string, unknown>) : undefined
  return {
    whitelabel: {
      id: typeof data.id === "number" ? data.id : 0,
      slug,
      name: typeof data.name === "string" && data.name.trim() ? data.name : slug,
    },
    environment: "ENTREPRENEUR",
    branding: brandingFromPages(pages),
  }
}

export async function initTenant(signal?: AbortSignal): Promise<TenantState> {
  if (state) return state

  const resolved = await resolveFromApis(signal)
  if (resolved?.whitelabel?.slug) {
    state = {
      slug: resolved.whitelabel.slug,
      name: resolved.whitelabel.name,
      id: resolved.whitelabel.id || null,
      source: "bootstrap",
      bootstrap: resolved,
    }
    return state
  }

  const hostSlug =
    typeof window !== "undefined" ? slugFromHostname(window.location.hostname) : null
  if (hostSlug) {
    state = { slug: hostSlug, name: hostSlug, id: null, source: "hostname", bootstrap: null }
    return state
  }

  const fallback = viteFallbackSlug()
  if (fallback) {
    state = { slug: fallback, name: fallback, id: null, source: "vite_fallback", bootstrap: null }
    return state
  }

  throw new Error(
    "Não foi possível resolver o Whitelabel. Use {slug}.empresa.localhost / .loor.vc ou VITE_API_SLUG.",
  )
}

export function getTenantSlug(): string {
  if (!state) {
    const fallback = viteFallbackSlug()
    if (fallback) return fallback
    throw new Error("Tenant não inicializado")
  }
  return state.slug
}

export function getBootstrapBranding(): PlatformBootstrap["branding"] | null {
  return state?.bootstrap?.branding ?? null
}
