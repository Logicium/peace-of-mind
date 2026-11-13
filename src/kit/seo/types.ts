/* vendored from apotome-seo 1.3.0; edit the source, then re-run vendor.mjs */
/**
 * The shapes behind the Apotome Labs SEO + AEO Standard.
 *
 * Two inputs feed everything the module produces: a `SiteConfig` (who the site
 * is for, where it lives, how crawlers may treat it) and the route table, where
 * each route carries a `seo` record in its `meta`. The head tags, JSON-LD,
 * sitemap, robots.txt, llms.txt and the prerendered HTML are all derived from
 * those two, so a page cannot say one thing to a visitor and another to a
 * crawler.
 *
 * Browser-safe: no Node imports here.
 */

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface OpeningHours {
  days: Weekday[]
  /** 24-hour HH:MM */
  opens: string
  closes: string
}

export interface PostalAddress {
  streetAddress?: string
  addressLocality: string
  addressRegion: string
  postalCode?: string
  /** ISO 3166-1 alpha-2, "US" */
  addressCountry: string
}

export interface SeoImage {
  /** absolute, or site-relative starting with "/" */
  url: string
  width?: number
  height?: number
  alt?: string
}

/**
 * The entity the site is about: a business, an organisation or a person.
 *
 * `type` is a schema.org type. Anything that is a LocalBusiness subtype
 * (Restaurant, Bakery, Store, MedicalBusiness, ProfessionalService...) gets the
 * local fields; Organization and its subtypes get the organisation fields;
 * Person gets a ProfilePage on the home page.
 */
export interface SiteEntity {
  type: string
  name: string
  legalName?: string
  description?: string
  /** square logo, 512px or larger */
  logo?: string
  image?: string
  email?: string
  telephone?: string
  address?: PostalAddress
  geo?: { latitude: number; longitude: number }
  hours?: OpeningHours[]
  /** "$", "$$", "$$$" */
  priceRange?: string
  areaServed?: string[]
  /** social profiles, Google Business Profile, directories */
  sameAs?: string[]
  foundingDate?: string
  /** for Person entities */
  jobTitle?: string
  worksFor?: { name: string; url?: string }
  alumniOf?: string[]
  knowsAbout?: string[]
  /** anything else the type supports; merged last, never validated */
  extra?: Record<string, unknown>
}

export type TrainingPolicy = 'allow' | 'block'

export interface CrawlerPolicy {
  /**
   * Training-only crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended...).
   * Answer crawlers are always allowed; see robots.ts.
   */
  training: TrainingPolicy
  /** paths disallowed on top of the private prefixes */
  disallow?: string[]
}

export interface SiteConfig {
  /** canonical origin, https, no trailing slash */
  siteUrl: string
  /** brand name, used as the title suffix */
  name: string
  /** finishes the home title: "Brand · tagline" */
  tagline?: string
  /** fallback description, only ever used by a page without its own */
  description: string
  /** "en" */
  lang?: string
  /** "en_US" */
  locale?: string
  /** the default share card, 1200 x 630 */
  image: SeoImage
  /** "@handle" */
  twitter?: string
  entity: SiteEntity
  crawlers?: CrawlerPolicy
  /**
   * Path prefixes that are never indexed: noindex in the HTML, excluded from
   * the sitemap, disallowed in robots.txt. Defaults to DEFAULT_PRIVATE_PREFIXES.
   */
  privatePrefixes?: string[]
  verification?: { google?: string; bing?: string }
  /** inner-page titles; default `${title} · ${name}` */
  titleTemplate?: (title: string) => string
  /** false takes the whole site out of the index (staging, drafts) */
  indexable?: boolean
  /** the short llms.txt summary; defaults to the description */
  llmsSummary?: string
  /** emitted into the page head once, verbatim; for a site-wide extra node */
  extraJsonLd?: object[]
}

export const DEFAULT_PRIVATE_PREFIXES = [
  '/admin',
  '/account',
  '/dashboard',
  '/checkout',
  '/order',
  '/login',
  '/signup',
  '/logout',
  '/reset',
  '/claim',
  '/preview',
  '/portal',
  '/c/',
  '/api',
]

export type PageType = 'website' | 'article' | 'product' | 'profile'

export interface ArticleMeta {
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

export interface Crumb {
  name: string
  /** site-relative; omitted on the last crumb */
  path?: string
}

/** What a route's seo function receives. */
export interface PageContext<T = unknown> {
  site: SiteConfig
  /** the resolved path, "/journal/my-post" */
  path: string
  params: Record<string, string>
  /** the record behind a dynamic route, when there is one */
  data: T
}

type Maybe<T, D = unknown> = T | ((ctx: PageContext<D>) => T)

export interface RouteInstance<T = unknown> {
  params: Record<string, string>
  data: T
}

export interface ExpandContext {
  site: SiteConfig
  /** VITE_API_URL or its equivalent, when the build has one */
  apiUrl?: string
  fetch: typeof fetch
}

/**
 * A route's SEO record, kept in `meta.seo`.
 *
 * Every field accepts a value or a function of the page context, so a dynamic
 * route can say `title: ({ data }) => data.title`.
 */
export interface RouteSeo<T = unknown> {
  title?: Maybe<string, T>
  description?: Maybe<string, T>
  image?: Maybe<SeoImage | string | undefined, T>
  type?: Maybe<PageType, T>
  noindex?: Maybe<boolean, T>
  /** crumbs after Home; derived from the path when absent */
  breadcrumb?: Maybe<Crumb[] | string[] | undefined, T>
  /** ISO date of the last real change, or nothing */
  lastmod?: Maybe<string | undefined, T>
  article?: Maybe<ArticleMeta | undefined, T>
  /** extra JSON-LD nodes for this page */
  schema?: (ctx: PageContext<T>) => object | object[] | undefined
  /** the prerendered body for #app, as HTML; a site-provided snapshot */
  body?: (ctx: PageContext<T>) => string
  /** instances of a dynamic route, fetched at build */
  expand?: (ctx: ExpandContext) => Promise<RouteInstance<T>[]> | RouteInstance<T>[]
  /** the primary image for the image sitemap, when different from `image` */
  sitemapImage?: Maybe<SeoImage | undefined, T>
}

declare module 'vue-router' {
  interface RouteMeta {
    seo?: RouteSeo<any>
  }
}

/** One page, fully resolved: what the head, sitemap and prerender consume. */
export interface ResolvedPage {
  path: string
  url: string
  title: string
  description: string
  image: Required<Pick<SeoImage, 'url'>> & SeoImage
  type: PageType
  noindex: boolean
  jsonLd: object[]
  lastmod?: string
  article?: ArticleMeta
  body?: string
  sitemapImage?: SeoImage
}

export interface HeadTag {
  tag: 'title' | 'meta' | 'link' | 'script'
  attrs: Record<string, string>
  text?: string
}
