/**
 * Runtime tenant for shared Entrepreneur builds.
 * Precedence: /w/{slug} (when present) → hostname → VITE_API_SLUG / VITE_PLATFORM_SLUG.
 * Path wins on shared hosts so PATH demos are not shadowed by the host WL.
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
  source: "hostname" | "path" | "bootstrap" | "platform" | "vite_fallback"
  bootstrap: PlatformBootstrap | null
  pathPrefix: string
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

const PATH_TENANT_RE = /^\/w\/([a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?)(?=\/|$)/i

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

export function slugFromPathname(pathname: string): string | null {
  const match = pathname.trim().match(PATH_TENANT_RE)
  if (!match?.[1]) return null
  return match[1].toLowerCase()
}

export function tenantRouterBasename(
  pathname = typeof window !== "undefined" ? window.location.pathname : "/",
): string {
  const pathSlug = slugFromPathname(pathname)
  if (pathSlug) return `/w/${pathSlug}`
  return "/"
}

export function getTenantPathPrefix(): string {
  if (state?.pathPrefix) return state.pathPrefix
  if (typeof window === "undefined") return ""
  const pathSlug = slugFromPathname(window.location.pathname)
  return pathSlug ? `/w/${pathSlug}` : ""
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

async function fetchBootstrap(
  explicitSlug: string | null,
  signal?: AbortSignal,
): Promise<PlatformBootstrap | null> {
  const qs = explicitSlug ? `?slug=${encodeURIComponent(explicitSlug)}` : ""
  const json = (await fetchJson(`/public/platform/bootstrap${qs}`, signal)) as {
    data?: PlatformBootstrap
  } | null
  if (json?.data?.whitelabel?.slug) return json.data
  return null
}

async function fetchPlatformFallback(
  slugHint: string | null,
  signal?: AbortSignal,
): Promise<PlatformBootstrap | null> {
  const path = slugHint
    ? `/investor/platform?platform_slug=${encodeURIComponent(slugHint)}`
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

function commitState(
  partial: Omit<TenantState, "pathPrefix"> & { pathPrefix?: string },
): TenantState {
  const fromUrl =
    typeof window !== "undefined" ? slugFromPathname(window.location.pathname) : null
  const pathPrefix =
    partial.pathPrefix ??
    (fromUrl ? `/w/${fromUrl}` : partial.source === "path" ? `/w/${partial.slug}` : "")
  state = { ...partial, pathPrefix }
  return state
}

export async function initTenant(signal?: AbortSignal): Promise<TenantState> {
  if (state) return state

  const hostSlug =
    typeof window !== "undefined" ? slugFromHostname(window.location.hostname) : null
  const pathSlug =
    typeof window !== "undefined" ? slugFromPathname(window.location.pathname) : null

  if (pathSlug) {
    const boot =
      (await fetchBootstrap(pathSlug, signal)) ?? (await fetchPlatformFallback(pathSlug, signal))
    if (boot?.whitelabel?.slug) {
      return commitState({
        slug: boot.whitelabel.slug,
        name: boot.whitelabel.name,
        id: boot.whitelabel.id || null,
        source: "path",
        bootstrap: boot,
        pathPrefix: `/w/${pathSlug}`,
      })
    }
    return commitState({
      slug: pathSlug,
      name: pathSlug,
      id: null,
      source: "path",
      bootstrap: null,
      pathPrefix: `/w/${pathSlug}`,
    })
  }

  if (hostSlug) {
    const boot = (await fetchBootstrap(null, signal)) ?? (await fetchPlatformFallback(hostSlug, signal))
    if (boot?.whitelabel?.slug) {
      return commitState({
        slug: boot.whitelabel.slug,
        name: boot.whitelabel.name,
        id: boot.whitelabel.id || null,
        source: "hostname",
        bootstrap: boot,
        pathPrefix: "",
      })
    }
    return commitState({
      slug: hostSlug,
      name: hostSlug,
      id: null,
      source: "hostname",
      bootstrap: null,
      pathPrefix: "",
    })
  }

  const fallback = viteFallbackSlug()
  if (fallback) {
    const boot = await fetchBootstrap(fallback, signal)
    return commitState({
      slug: boot?.whitelabel?.slug ?? fallback,
      name: boot?.whitelabel?.name ?? fallback,
      id: boot?.whitelabel?.id || null,
      source: "vite_fallback",
      bootstrap: boot,
      pathPrefix: "",
    })
  }

  throw new Error(
    "Não foi possível resolver o Whitelabel. Use {slug}.empresa.loor.vc, /w/{slug} ou VITE_API_SLUG.",
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

export function __resetTenantForTests(): void {
  state = null
}
