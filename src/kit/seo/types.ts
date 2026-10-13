/**
 * The shape of a site's search settings.
 *
 * This mirrors `seo-policy.ts` in the service, deliberately and by hand: the
 * kit is vendored into repositories that share no build with the studio, so a
 * shared package is not on the table. The server normalizes before it stores
 * and before it serves, so anything arriving here has already been trimmed,
 * clamped and deduplicated. Everything below is present; strings are empty
 * rather than missing.
 */

export type SitemapFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

export interface SeoPage {
  /** site-relative, leading slash, no trailing slash except the root */
  path: string
  title?: string
  description?: string
  image?: string
  noindex?: boolean
  changefreq?: SitemapFrequency
  priority?: number
}

export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'

export interface OpeningHours {
  days: Weekday[]
  /** 24-hour, HH:MM */
  opens: string
  closes: string
}

export interface SeoOrganization {
  type: 'Organization' | 'LocalBusiness' | 'Restaurant' | 'ProfessionalService' | 'Person'
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
  /** what puts a business in the map pack rather than only the blue links */
  latitude: number | null
  longitude: number | null
  hours: OpeningHours[]
  priceRange: string
}

export interface SeoSettings {
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
  organization: SeoOrganization
  verification: { google: string; bing: string }
  pages: SeoPage[]
}

/** The page a path resolves to, or a bare entry so nothing renders untitled. */
export function pageFor(settings: SeoSettings, path: string): SeoPage {
  const wanted = normalizePath(path)
  return settings.pages.find((p) => p.path === wanted) ?? { path: wanted }
}

/** Same rule the server uses, so a lookup here matches what was stored. */
export function normalizePath(input: string): string {
  let p = (input || '/').split('#')[0]!.split('?')[0]!
  const m = p.match(/^https?:\/\/[^/]+(\/.*)?$/i)
  if (m) p = m[1] ?? '/'
  if (!p.startsWith('/')) p = `/${p}`
  p = p.replace(/\/{2,}/g, '/')
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p || '/'
}

/** The title as it should appear in the tab and the search result. */
export function titleFor(settings: SeoSettings, page: SeoPage): string {
  if (page.path === '/') return page.title || settings.defaultTitle || settings.siteName
  if (!page.title) return settings.defaultTitle || settings.siteName
  const template = settings.titleTemplate.includes('%s') ? settings.titleTemplate : '%s'
  return template.replace('%s', page.title)
}

export function descriptionFor(settings: SeoSettings, page: SeoPage): string {
  return page.description || settings.defaultDescription
}

export function imageFor(settings: SeoSettings, page: SeoPage): string {
  return page.image || settings.ogImage
}

/** The absolute URL of a page, which is what a canonical tag has to carry. */
export function urlFor(settings: SeoSettings, page: SeoPage): string {
  if (!settings.domain) return page.path
  return page.path === '/' ? `${settings.domain}/` : `${settings.domain}${page.path}`
}
