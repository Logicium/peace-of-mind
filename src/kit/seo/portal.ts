/* vendored from apotome-seo 1.1.1; edit the source, then re-run vendor.mjs */
/**
 * The portal's published Search settings, folded into a SiteConfig.
 *
 * Kit sites let the client edit titles, descriptions and the business record
 * in their portal. At build the prerender fetches what was published and
 * merges it over the repo's site config: the repo decides structure and
 * defaults, the client decides words. Browser-safe.
 */

import type { RouteRecordRaw } from 'vue-router'
import type { OpeningHours, SiteConfig, Weekday } from './types'

export interface PortalSeoPage {
  path: string
  title?: string
  description?: string
  image?: string
  noindex?: boolean
}

export interface PortalSeoSettings {
  siteName: string
  domain: string
  titleTemplate: string
  defaultTitle: string
  defaultDescription: string
  ogImage: string
  twitterHandle: string
  locale: string
  indexable: boolean
  keywords: string[]
  organization: {
    type: string
    name: string
    logo: string
    email: string
    phone: string
    streetAddress: string
    locality: string
    region: string
    postalCode: string
    country: string
    sameAs: string[]
    latitude: number | null
    longitude: number | null
    hours: { days: Weekday[]; opens: string; closes: string }[]
    priceRange: string
  }
  verification: { google: string; bing: string }
  pages: PortalSeoPage[]
}

export async function fetchPortalSeo(apiUrl: string | undefined, siteKey: string | undefined, timeoutMs = 10_000): Promise<PortalSeoSettings | null> {
  if (!apiUrl || !siteKey) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/seo/${encodeURIComponent(siteKey)}`, { signal: controller.signal })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: PortalSeoSettings | null } | PortalSeoSettings | null
    const data = body && typeof body === 'object' && 'data' in body ? body.data : body
    return data && typeof data === 'object' && Array.isArray((data as PortalSeoSettings).pages) ? (data as PortalSeoSettings) : null
  } finally {
    clearTimeout(timer)
  }
}

const nonEmpty = (s: string | undefined | null) => (s && s.trim() ? s.trim() : undefined)

/** The repo config with the published words laid over it. */
export function mergePortalSeo(base: SiteConfig, s: PortalSeoSettings | null): SiteConfig {
  if (!s) return base
  const o = s.organization
  const hours: OpeningHours[] | undefined = o.hours?.length ? o.hours : base.entity.hours
  return {
    ...base,
    name: nonEmpty(s.siteName) ?? base.name,
    description: nonEmpty(s.defaultDescription) ?? base.description,
    locale: nonEmpty(s.locale) ?? base.locale,
    image: nonEmpty(s.ogImage) ? { ...base.image, url: s.ogImage, alt: base.image.alt } : base.image,
    twitter: nonEmpty(s.twitterHandle) ? `@${s.twitterHandle.replace(/^@/, '')}` : base.twitter,
    indexable: s.indexable === false ? false : base.indexable,
    verification: { google: nonEmpty(s.verification?.google) ?? base.verification?.google, bing: nonEmpty(s.verification?.bing) ?? base.verification?.bing },
    titleTemplate: s.titleTemplate?.includes('%s') ? (t: string) => s.titleTemplate.replace('%s', t) : base.titleTemplate,
    entity: {
      ...base.entity,
      type: nonEmpty(o.type) ?? base.entity.type,
      name: nonEmpty(o.name) ?? base.entity.name,
      logo: nonEmpty(o.logo) ?? base.entity.logo,
      email: nonEmpty(o.email) ?? base.entity.email,
      telephone: nonEmpty(o.phone) ?? base.entity.telephone,
      address:
        nonEmpty(o.locality) && nonEmpty(o.region)
          ? { streetAddress: nonEmpty(o.streetAddress), addressLocality: o.locality, addressRegion: o.region, postalCode: nonEmpty(o.postalCode), addressCountry: nonEmpty(o.country) ?? 'US' }
          : base.entity.address,
      geo: o.latitude != null && o.longitude != null ? { latitude: o.latitude, longitude: o.longitude } : base.entity.geo,
      hours,
      priceRange: nonEmpty(o.priceRange) ?? base.entity.priceRange,
      sameAs: o.sameAs?.length ? o.sameAs : base.entity.sameAs,
    },
  }
}

/**
 * Lay the published per-page words over the route table. A page the client
 * edited keeps the route's structure (schema, body, expand) and takes the
 * client's title, description, image and noindex.
 */
export function applyPortalPages(routes: RouteRecordRaw[], s: PortalSeoSettings | null): RouteRecordRaw[] {
  if (!s?.pages?.length) return routes
  const byPath = new Map(s.pages.map((p) => [p.path.replace(/\/+$/, '') || '/', p]))
  const walk = (list: RouteRecordRaw[], parent = ''): RouteRecordRaw[] =>
    list.map((r) => {
      const full = r.path.startsWith('/') ? r.path : `${parent}/${r.path}`.replace(/\/+/g, '/')
      const override = byPath.get(full.replace(/\/+$/, '') || '/')
      const seo = r.meta?.seo
      const next: RouteRecordRaw = { ...r } as RouteRecordRaw
      if (override) {
        next.meta = {
          ...(r.meta ?? {}),
          seo: {
            ...(seo ?? {}),
            ...(nonEmpty(override.title) ? { title: override.title } : {}),
            ...(nonEmpty(override.description) ? { description: override.description } : {}),
            ...(nonEmpty(override.image) ? { image: override.image } : {}),
            ...(override.noindex ? { noindex: true } : {}),
          },
        }
      }
      if (r.children?.length) (next as { children?: RouteRecordRaw[] }).children = walk(r.children, full)
      return next
    })
  return walk(routes)
}
