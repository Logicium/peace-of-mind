/**
 * One page's head, as tags.
 *
 * Pure string work, no DOM and no filesystem, so the same function serves the
 * build script that stamps static HTML and the composable that keeps a single
 * page app honest between routes. That shared origin is the point: a site
 * whose crawler sees one title and whose visitor sees another is a site with
 * two SEO implementations, and one of them is always the stale one.
 */

import {
  descriptionFor,
  imageFor,
  titleFor,
  urlFor,
  type SeoPage,
  type SeoSettings,
} from './types'

export interface HeadTag {
  /** the element name, always a void or text element that belongs in <head> */
  tag: 'title' | 'meta' | 'link' | 'script'
  attrs: Record<string, string>
  /** text content, for title and JSON-LD */
  text?: string
}

/** Escapes for an attribute value or text node inside head. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Structured data for the business behind the site.
 *
 * Only fields with something in them are emitted. A schema.org object with
 * empty strings in it is worse than a smaller one: validators read `""` as a
 * claim that the business has no address, rather than as no claim at all.
 */
export function organizationJsonLd(settings: SeoSettings): Record<string, unknown> | null {
  const org = settings.organization
  if (!org.name) return null

  const address: Record<string, string> = {}
  if (org.streetAddress) address.streetAddress = org.streetAddress
  if (org.locality) address.addressLocality = org.locality
  if (org.region) address.addressRegion = org.region
  if (org.postalCode) address.postalCode = org.postalCode
  if (org.country) address.addressCountry = org.country

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': org.type,
    name: org.name,
  }
  if (settings.domain) node.url = `${settings.domain}/`
  if (org.logo) node.logo = org.logo
  if (org.email) node.email = org.email
  if (org.phone) node.telephone = org.phone
  /*
   * Country alone is not an address. It defaults to US for every site, so
   * emitting it on its own publishes a PostalAddress that says nothing but
   * claims to be one. A street or a town has to be there first.
   */
  if (address.streetAddress || address.addressLocality) {
    node.address = { '@type': 'PostalAddress', ...address }
  }
  if (org.sameAs.length) node.sameAs = org.sameAs

  /* the coordinates a map reads, which an address alone makes it guess at */
  if (org.latitude != null && org.longitude != null) {
    node.geo = {
      '@type': 'GeoCoordinates',
      latitude: org.latitude,
      longitude: org.longitude,
    }
  }

  if (org.hours.length) {
    node.openingHoursSpecification = org.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    }))
  }

  if (org.priceRange) node.priceRange = org.priceRange
  if (settings.ogImage) node.image = settings.ogImage

  return node
}

/** WebSite, so search engines can name the site itself rather than a page. */
export function websiteJsonLd(settings: SeoSettings): Record<string, unknown> | null {
  if (!settings.domain || !settings.siteName) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.siteName,
    url: `${settings.domain}/`,
  }
}

/**
 * The trail from the home page to this one.
 *
 * Built from the path, because a path is the only hierarchy a flat settings
 * list actually knows. `/services/roofing` yields Home / Services / Roofing,
 * with the middle crumb linked whether or not it is a page we listed: a
 * breadcrumb that skips a level reads as a broken site to a crawler.
 */
export function breadcrumbJsonLd(
  settings: SeoSettings,
  page: SeoPage,
): Record<string, unknown> | null {
  if (page.path === '/' || !settings.domain) return null
  const parts = page.path.split('/').filter(Boolean)
  const crumbs = [{ name: 'Home', url: `${settings.domain}/` }]
  let walked = ''
  parts.forEach((part, i) => {
    walked += `/${part}`
    const listed = settings.pages.find((p) => p.path === walked)
    const last = i === parts.length - 1
    crumbs.push({
      name: last ? page.title || titleCase(part) : listed?.title || titleCase(part),
      url: `${settings.domain}${walked}`,
    })
  })
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  }
}

function titleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * Every head tag one page needs, in the order a reader would want them.
 *
 * `noindex` is decided in one place: the site switch off, or the page's own
 * flag. Getting that wrong in either direction is the most expensive mistake
 * in this file, so it is computed once and used by the meta tag, the sitemap
 * and robots.txt alike.
 */
export function headTags(settings: SeoSettings, page: SeoPage): HeadTag[] {
  const title = titleFor(settings, page)
  const description = descriptionFor(settings, page)
  const url = urlFor(settings, page)
  const image = imageFor(settings, page)
  const noindex = !settings.indexable || page.noindex === true

  const tags: HeadTag[] = []
  if (title) tags.push({ tag: 'title', attrs: {}, text: title })
  if (description) tags.push({ tag: 'meta', attrs: { name: 'description', content: description } })
  if (settings.keywords.length) {
    tags.push({ tag: 'meta', attrs: { name: 'keywords', content: settings.keywords.join(', ') } })
  }
  if (settings.siteName) {
    tags.push({ tag: 'meta', attrs: { name: 'author', content: settings.siteName } })
    tags.push({ tag: 'meta', attrs: { name: 'publisher', content: settings.siteName } })
  }

  /*
   * Two robots lines, not one. The general directive is what every crawler
   * reads; the googlebot one lifts the snippet and preview caps, which is
   * what lets a full description and a large image show in a result rather
   * than Google's own shortened guess.
   */
  const allow = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  tags.push({
    tag: 'meta',
    attrs: {
      name: 'robots',
      // noimageindex is deliberately absent: a page we do index should have
      // its pictures indexed too, and a page we do not is already excluded
      content: noindex ? 'noindex, nofollow' : allow,
    },
  })
  if (!noindex) {
    tags.push({ tag: 'meta', attrs: { name: 'googlebot', content: allow } })
  }

  if (settings.domain) {
    tags.push({ tag: 'link', attrs: { rel: 'canonical', href: url } })
    /*
     * One language, said out loud. A single-language site still benefits:
     * x-default names the page a search engine should serve when it has no
     * better match for the visitor's own language.
     */
    const lang = (settings.locale || 'en_US').replace('_', '-')
    tags.push({ tag: 'link', attrs: { rel: 'alternate', hreflang: lang, href: url } })
    tags.push({ tag: 'link', attrs: { rel: 'alternate', hreflang: 'x-default', href: url } })
  }

  /* Open Graph: what every chat app and social network reads. */
  if (title) tags.push({ tag: 'meta', attrs: { property: 'og:title', content: title } })
  if (description)
    tags.push({ tag: 'meta', attrs: { property: 'og:description', content: description } })
  tags.push({ tag: 'meta', attrs: { property: 'og:type', content: 'website' } })
  if (settings.domain) tags.push({ tag: 'meta', attrs: { property: 'og:url', content: url } })
  if (settings.siteName)
    tags.push({ tag: 'meta', attrs: { property: 'og:site_name', content: settings.siteName } })
  if (settings.locale)
    tags.push({ tag: 'meta', attrs: { property: 'og:locale', content: settings.locale } })
  if (image) {
    tags.push({ tag: 'meta', attrs: { property: 'og:image', content: image } })
    tags.push({ tag: 'meta', attrs: { property: 'og:image:alt', content: title || settings.siteName } })
  }

  /* Twitter: a large card when there is an image, a plain one when not. */
  tags.push({
    tag: 'meta',
    attrs: { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
  })
  if (settings.twitterHandle) {
    tags.push({ tag: 'meta', attrs: { name: 'twitter:site', content: `@${settings.twitterHandle}` } })
  }
  if (settings.domain) tags.push({ tag: 'meta', attrs: { name: 'twitter:url', content: url } })
  if (title) tags.push({ tag: 'meta', attrs: { name: 'twitter:title', content: title } })
  if (description)
    tags.push({ tag: 'meta', attrs: { name: 'twitter:description', content: description } })
  if (image) {
    tags.push({ tag: 'meta', attrs: { name: 'twitter:image', content: image } })
    tags.push({
      tag: 'meta',
      attrs: { name: 'twitter:image:alt', content: title || settings.siteName },
    })
  }

  /*
   * Where the business is, for the engines that read it directly rather than
   * through structured data. On every page, not just the home page: a local
   * result can be won by any page, and the ones that get linked to are rarely
   * the front door.
   */
  const org = settings.organization
  if (org.locality) {
    const placename = [org.locality, org.region].filter(Boolean).join(', ')
    tags.push({ tag: 'meta', attrs: { name: 'geo.placename', content: placename } })
  }
  if (org.region && org.country) {
    tags.push({
      tag: 'meta',
      attrs: { name: 'geo.region', content: `${org.country}-${org.region}` },
    })
  }
  if (org.latitude != null && org.longitude != null) {
    tags.push({
      tag: 'meta',
      attrs: { name: 'geo.position', content: `${org.latitude};${org.longitude}` },
    })
    tags.push({ tag: 'meta', attrs: { name: 'ICBM', content: `${org.latitude}, ${org.longitude}` } })
  }

  /* Site ownership. Only ever on the home page, where the engines look. */
  if (page.path === '/') {
    if (settings.verification.google) {
      tags.push({
        tag: 'meta',
        attrs: { name: 'google-site-verification', content: settings.verification.google },
      })
    }
    if (settings.verification.bing) {
      tags.push({ tag: 'meta', attrs: { name: 'msvalidate.01', content: settings.verification.bing } })
    }
  }

  /* Structured data, one script per node so a bad one cannot poison the rest. */
  const nodes = [
    page.path === '/' ? websiteJsonLd(settings) : null,
    page.path === '/' ? organizationJsonLd(settings) : null,
    breadcrumbJsonLd(settings, page),
  ].filter(Boolean) as Record<string, unknown>[]
  for (const node of nodes) {
    tags.push({
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      text: JSON.stringify(node),
    })
  }

  return tags
}

/** The same tags as HTML, for a build script writing a file. */
export function headHtml(settings: SeoSettings, page: SeoPage): string {
  return headTags(settings, page)
    .map((t) => {
      const attrs = Object.entries(t.attrs)
        .map(([k, v]) => ` ${k}="${esc(v)}"`)
        .join('')
      if (t.tag === 'title') return `<title>${esc(t.text ?? '')}</title>`
      if (t.tag === 'script') {
        // JSON inside a script element: only `</script` can end it early, and
        // escaping the slash keeps the JSON valid for the parser that reads it
        const json = (t.text ?? '').replace(/<\//g, '<\\/')
        return `<script${attrs}>${json}</script>`
      }
      return `<${t.tag}${attrs} />`
    })
    .join('\n    ')
}
