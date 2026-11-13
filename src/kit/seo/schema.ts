/* vendored from apotome-seo 1.2.0; edit the source, then re-run vendor.mjs */
/**
 * JSON-LD builders.
 *
 * Every builder returns a plain node with a stable `@id`, and `graph()` wraps a
 * page's nodes in one `@context` + `@graph`, which is the one script the page
 * emits. Builders throw on a missing required field, so a placeholder or an
 * empty record fails the build instead of shipping a false claim.
 *
 * Required and recommended properties follow Google's structured data
 * reference as of November 2026; see section 6 of the standard.
 */

import { absUrl, truncate } from './text'
import type { Crumb, PostalAddress, SeoImage, SiteConfig, SiteEntity } from './types'

const LOCAL_BUSINESS_TYPES = new Set([
  'LocalBusiness',
  'Restaurant',
  'Bakery',
  'CafeOrCoffeeShop',
  'BarOrPub',
  'FoodEstablishment',
  'LodgingBusiness',
  'Hotel',
  'BedAndBreakfast',
  'Store',
  'MedicalBusiness',
  'Physician',
  'Dentist',
  'HealthAndBeautyBusiness',
  'DaySpa',
  'BeautySalon',
  'ProfessionalService',
  'HomeAndConstructionBusiness',
  'GeneralContractor',
  'Electrician',
  'Plumber',
  'RoofingContractor',
  'LegalService',
  'FinancialService',
  'AutoRepair',
  'EntertainmentBusiness',
  'EventVenue',
  'PerformingArtsTheater',
  'ArtGallery',
  'TouristAttraction',
  'ChildCare',
  'SportsActivityLocation',
  'ExerciseGym',
  'RealEstateAgent',
  'TravelAgency',
  'Florist',
  'PetStore',
  'VeterinaryCare',
])

export const isLocalBusiness = (type: string) => LOCAL_BUSINESS_TYPES.has(type)
export const isPerson = (type: string) => type === 'Person'

export const entityId = (site: SiteConfig) => `${site.siteUrl}/#${isPerson(site.entity.type) ? 'person' : 'organization'}`
export const websiteId = (site: SiteConfig) => `${site.siteUrl}/#website`

class SchemaError extends Error {
  constructor(type: string, field: string) {
    super(`[seo] ${type} needs "${field}" and the site config does not set it`)
  }
}

const PLACEHOLDER = /\b(555-?01\d{2}|555-?1234|123 Main|lorem|ipsum|example\.com|TODO|TBD|replace me|your (name|business))\b/i

/** Throws when a value is missing or still a placeholder. */
export function required<T>(type: string, field: string, value: T | undefined | null | ''): T {
  if (value === undefined || value === null || value === '') throw new SchemaError(type, field)
  if (typeof value === 'string' && PLACEHOLDER.test(value)) {
    throw new Error(`[seo] ${type}.${field} looks like a placeholder: "${value}"`)
  }
  return value
}

/** Drop undefined, null, empty strings and empty arrays. */
export function compact<T extends Record<string, unknown>>(node: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(node)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out as T
}

/** A stable fragment for an @id: lowercase words joined by hyphens. */
export function idSlug(text: string): string {
  return (
    String(text)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'item'
  )
}

export function graph(nodes: (object | undefined | null)[]): object {
  const seen = new Map<string, string>()
  const list: object[] = []
  for (const n of nodes) {
    if (!n) continue
    const id = (n as { '@id'?: string })['@id']
    if (id) {
      const prev = seen.get(id)
      if (prev !== undefined) {
        // the same node twice is fine; two different nodes under one id lose one of them
        if (prev !== JSON.stringify(n)) console.warn(`[seo] two different nodes share @id ${id}; the second was dropped`)
        continue
      }
      seen.set(id, JSON.stringify(n))
    }
    // a node built elsewhere may carry its own @context; the graph has one
    const { '@context': _ctx, ...rest } = n as Record<string, unknown>
    list.push(rest)
  }
  return { '@context': 'https://schema.org', '@graph': list }
}

const imageObject = (site: SiteConfig, img: SeoImage | string | undefined) => {
  if (!img) return undefined
  const i = typeof img === 'string' ? { url: img } : img
  return compact({ '@type': 'ImageObject', url: absUrl(site, i.url), width: i.width, height: i.height, caption: i.alt })
}

const postalAddress = (a: PostalAddress | undefined) =>
  a
    ? compact({
        '@type': 'PostalAddress',
        streetAddress: a.streetAddress,
        addressLocality: a.addressLocality,
        addressRegion: a.addressRegion,
        postalCode: a.postalCode,
        addressCountry: a.addressCountry,
      })
    : undefined

const hoursSpec = (e: SiteEntity) =>
  e.hours?.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes }))

/**
 * The entity node: LocalBusiness (or subtype), Organization (or subtype), or
 * Person. Field requirements per section 6.3 of the standard.
 */
/** Every string in a record, with its dotted path. */
function strings(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]]
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${prefix}[${i}]`))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => strings(v, prefix ? `${prefix}.${k}` : k))
  return []
}

/** Throws on any placeholder anywhere in the site's entity or config text. */
export function assertNoPlaceholders(site: SiteConfig): void {
  const all: [string, string][] = [...strings(site.entity, 'entity'), ['description', site.description], ['name', site.name]]
  for (const [path, value] of all) {
    if (PLACEHOLDER.test(value)) throw new Error(`[seo] ${path} looks like a placeholder: "${value}"`)
  }
}

export function entityNode(site: SiteConfig): object {
  assertNoPlaceholders(site)
  const e = site.entity
  const type = required('entity', 'type', e.type)
  const name = required(type, 'name', e.name)
  const base = {
    '@type': type,
    '@id': entityId(site),
    name,
    url: `${site.siteUrl}/`,
    description: e.description ? truncate(e.description, 300) : undefined,
    image: imageObject(site, e.image ?? site.image),
    email: e.email,
    telephone: e.telephone,
    sameAs: e.sameAs,
  }

  if (isPerson(type)) {
    return compact({
      ...base,
      jobTitle: e.jobTitle,
      worksFor: e.worksFor ? compact({ '@type': 'Organization', name: e.worksFor.name, url: e.worksFor.url }) : undefined,
      address: postalAddress(e.address),
      alumniOf: e.alumniOf?.map((n) => ({ '@type': 'CollegeOrUniversity', name: n })),
      knowsAbout: e.knowsAbout,
      ...(e.extra ?? {}),
    })
  }

  const org = {
    ...base,
    legalName: e.legalName,
    logo: imageObject(site, e.logo ?? site.entity.image ?? site.image.url),
    foundingDate: e.foundingDate,
    areaServed: e.areaServed,
    knowsAbout: e.knowsAbout,
  }

  if (isLocalBusiness(type)) {
    // Google: name and address required; the standard adds geo, hours, phone,
    // image, sameAs, priceRange and areaServed for the map pack and assistants
    const address = required(type, 'address', e.address)
    required(type, 'address.addressLocality', address.addressLocality)
    required(type, 'address.addressRegion', address.addressRegion)
    required(type, 'address.addressCountry', address.addressCountry)
    return compact({
      ...org,
      address: postalAddress(address),
      geo: e.geo ? { '@type': 'GeoCoordinates', latitude: e.geo.latitude, longitude: e.geo.longitude } : undefined,
      openingHoursSpecification: hoursSpec(e),
      priceRange: e.priceRange,
      hasMap: e.geo ? `https://www.google.com/maps/search/?api=1&query=${e.geo.latitude},${e.geo.longitude}` : undefined,
      ...(e.extra ?? {}),
    })
  }

  return compact({
    ...org,
    address: postalAddress(e.address),
    contactPoint: e.email || e.telephone ? compact({ '@type': 'ContactPoint', contactType: 'customer service', email: e.email, telephone: e.telephone }) : undefined,
    ...(e.extra ?? {}),
  })
}

export function websiteNode(site: SiteConfig): object {
  return compact({
    '@type': 'WebSite',
    '@id': websiteId(site),
    name: required('WebSite', 'name', site.name),
    url: `${required('WebSite', 'siteUrl', site.siteUrl)}/`,
    description: truncate(site.description, 300),
    inLanguage: (site.locale ?? 'en_US').replace('_', '-'),
    publisher: { '@id': entityId(site) },
  })
}

/** A ProfilePage wrapping a Person entity, for the home page of a person site. */
export function profilePageNode(site: SiteConfig, path = '/', person?: object): object {
  return compact({
    '@type': 'ProfilePage',
    '@id': `${absUrl(site, path)}#profile`,
    url: absUrl(site, path),
    name: site.name,
    mainEntity: person ?? { '@id': entityId(site) },
    isPartOf: { '@id': websiteId(site) },
  })
}

export function breadcrumbNode(site: SiteConfig, path: string, crumbs: Crumb[]): object | undefined {
  const items = [{ name: 'Home', path: '/' }, ...crumbs]
  if (items.length < 2) return undefined
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absUrl(site, path)}#breadcrumb`,
    itemListElement: items.map((c, i) =>
      compact({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: c.path ? absUrl(site, c.path) : undefined,
      }),
    ),
  }
}

export function webPageNode(site: SiteConfig, page: { path: string; title: string; description: string; image: SeoImage; type: string; lastmod?: string }): object {
  const url = absUrl(site, page.path)
  return compact({
    '@type': page.type === 'article' ? 'WebPage' : page.type === 'profile' ? 'ProfilePage' : page.type === 'product' ? 'ItemPage' : 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': websiteId(site) },
    about: { '@id': entityId(site) },
    primaryImageOfPage: imageObject(site, page.image),
    dateModified: page.lastmod,
    inLanguage: (site.locale ?? 'en_US').replace('_', '-'),
  })
}

export interface ArticleInput {
  path: string
  headline: string
  description?: string
  image?: SeoImage | string
  datePublished: string
  dateModified?: string
  author?: { name: string; url?: string } | string
  section?: string
  keywords?: string[]
  wordCount?: number
  type?: 'Article' | 'BlogPosting' | 'NewsArticle'
}

export function articleNode(site: SiteConfig, a: ArticleInput): object {
  const url = absUrl(site, a.path)
  const author = typeof a.author === 'string' ? { name: a.author } : a.author
  return compact({
    '@type': a.type ?? 'BlogPosting',
    '@id': `${url}#article`,
    headline: required('Article', 'headline', a.headline),
    description: a.description ? truncate(a.description, 300) : undefined,
    image: imageObject(site, a.image ?? site.image),
    datePublished: required('Article', 'datePublished', a.datePublished),
    dateModified: a.dateModified ?? a.datePublished,
    author: author ? compact({ '@type': 'Person', name: author.name, url: author.url }) : { '@id': entityId(site) },
    publisher: { '@id': entityId(site) },
    mainEntityOfPage: url,
    url,
    articleSection: a.section,
    keywords: a.keywords?.join(', '),
    wordCount: a.wordCount,
    inLanguage: (site.locale ?? 'en_US').replace('_', '-'),
  })
}

export interface ProductInput {
  path: string
  name: string
  description?: string
  image: SeoImage | string | (SeoImage | string)[]
  sku?: string
  brand?: string
  price: number | string
  priceCurrency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder' | 'SoldOut'
  gtin?: string
  category?: string
}

export function productNode(site: SiteConfig, p: ProductInput): object {
  const url = absUrl(site, p.path)
  const images = (Array.isArray(p.image) ? p.image : [p.image]).map((i) => absUrl(site, typeof i === 'string' ? i : i.url))
  required('Product', 'image', images[0])
  return compact({
    '@type': 'Product',
    '@id': `${url}#product-${idSlug(p.sku ?? p.name)}`,
    name: required('Product', 'name', p.name),
    description: p.description ? truncate(p.description, 500) : undefined,
    image: images,
    sku: p.sku,
    gtin: p.gtin,
    category: p.category,
    brand: { '@type': 'Brand', name: p.brand ?? site.entity.name },
    url,
    offers: compact({
      '@type': 'Offer',
      url,
      price: String(required('Product', 'offers.price', p.price)),
      priceCurrency: p.priceCurrency ?? 'USD',
      availability: `https://schema.org/${p.availability ?? 'InStock'}`,
      seller: { '@id': entityId(site) },
    }),
  })
}

export interface EventInput {
  path: string
  name: string
  description?: string
  image?: SeoImage | string
  startDate: string
  endDate?: string
  location?: { name: string; address: PostalAddress } | 'online'
  offers?: { price: number | string; priceCurrency?: string; url?: string; availability?: string }
  organizer?: { name: string; url?: string }
  performer?: string | string[]
  status?: 'EventScheduled' | 'EventCancelled' | 'EventPostponed' | 'EventRescheduled' | 'EventMovedOnline'
  attendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode'
}

export function eventNode(site: SiteConfig, e: EventInput): object {
  const url = absUrl(site, e.path)
  const location =
    e.location === 'online'
      ? { '@type': 'VirtualLocation', url }
      : e.location
        ? compact({ '@type': 'Place', name: e.location.name, address: postalAddress(e.location.address) })
        : site.entity.address
          ? compact({ '@type': 'Place', name: site.entity.name, address: postalAddress(site.entity.address) })
          : undefined
  required('Event', 'location', location)
  return compact({
    '@type': 'Event',
    '@id': `${url}#event-${idSlug(e.name)}-${String(e.startDate).slice(0, 10)}`,
    name: required('Event', 'name', e.name),
    description: e.description ? truncate(e.description, 500) : undefined,
    image: imageObject(site, e.image ?? site.image),
    startDate: required('Event', 'startDate', e.startDate),
    endDate: e.endDate,
    eventStatus: `https://schema.org/${e.status ?? 'EventScheduled'}`,
    eventAttendanceMode: `https://schema.org/${e.attendanceMode ?? (e.location === 'online' ? 'OnlineEventAttendanceMode' : 'OfflineEventAttendanceMode')}`,
    location,
    url,
    organizer: e.organizer ? compact({ '@type': 'Organization', name: e.organizer.name, url: e.organizer.url }) : { '@id': entityId(site) },
    performer: e.performer ? (Array.isArray(e.performer) ? e.performer : [e.performer]).map((n) => ({ '@type': 'PerformingGroup', name: n })) : undefined,
    offers: e.offers
      ? compact({
          '@type': 'Offer',
          price: String(e.offers.price),
          priceCurrency: e.offers.priceCurrency ?? 'USD',
          url: e.offers.url ? absUrl(site, e.offers.url) : url,
          availability: `https://schema.org/${e.offers.availability ?? 'InStock'}`,
        })
      : undefined,
  })
}

export interface ServiceInput {
  path?: string
  name: string
  description?: string
  type?: string
  areaServed?: string[]
  offers?: { price?: number | string; priceCurrency?: string; description?: string }
}

export function serviceNode(site: SiteConfig, s: ServiceInput): object {
  return compact({
    '@type': 'Service',
    '@id': s.path ? `${absUrl(site, s.path)}#service-${idSlug(s.name)}` : undefined,
    name: required('Service', 'name', s.name),
    serviceType: s.type,
    description: s.description ? truncate(s.description, 300) : undefined,
    provider: { '@id': entityId(site) },
    areaServed: s.areaServed ?? site.entity.areaServed,
    url: s.path ? absUrl(site, s.path) : undefined,
    offers: s.offers
      ? compact({ '@type': 'Offer', price: s.offers.price != null ? String(s.offers.price) : undefined, priceCurrency: s.offers.priceCurrency ?? 'USD', description: s.offers.description })
      : undefined,
  })
}

export function faqNode(site: SiteConfig, path: string, items: { q: string; a: string }[]): object | undefined {
  if (!items.length) return undefined
  return {
    '@type': 'FAQPage',
    '@id': `${absUrl(site, path)}#faq`,
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  }
}

export function itemListNode(site: SiteConfig, path: string, name: string, items: { name: string; path: string; image?: string }[]): object {
  return {
    '@type': 'ItemList',
    '@id': `${absUrl(site, path)}#list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) =>
      compact({ '@type': 'ListItem', position: i + 1, name: it.name, url: absUrl(site, it.path), image: it.image ? absUrl(site, it.image) : undefined }),
    ),
  }
}

export function personNode(site: SiteConfig, p: { path?: string; name: string; jobTitle?: string; image?: string; description?: string; sameAs?: string[]; url?: string }): object {
  return compact({
    '@type': 'Person',
    '@id': p.path ? `${absUrl(site, p.path)}#person-${idSlug(p.name)}` : undefined,
    name: required('Person', 'name', p.name),
    jobTitle: p.jobTitle,
    image: p.image ? absUrl(site, p.image) : undefined,
    description: p.description ? truncate(p.description, 300) : undefined,
    sameAs: p.sameAs,
    url: p.url ?? (p.path ? absUrl(site, p.path) : undefined),
    worksFor: isPerson(site.entity.type) ? undefined : { '@id': entityId(site) },
  })
}

export function creativeWorkNode(
  site: SiteConfig,
  w: { path: string; name: string; type?: string; description?: string; image?: string; dateCreated?: string; genre?: string; extra?: Record<string, unknown> },
): object {
  const url = absUrl(site, w.path)
  return compact({
    '@type': w.type ?? 'CreativeWork',
    '@id': `${url}#work-${idSlug(w.name)}`,
    name: required(w.type ?? 'CreativeWork', 'name', w.name),
    description: w.description ? truncate(w.description, 300) : undefined,
    image: w.image ? absUrl(site, w.image) : undefined,
    dateCreated: w.dateCreated,
    genre: w.genre,
    url,
    creator: { '@id': entityId(site) },
    ...(w.extra ?? {}),
  })
}
