/* vendored from apotome-seo 1.0.1; edit the source, then re-run vendor.mjs */
/**
 * One page's head, as tags.
 *
 * Pure: no DOM, no filesystem. The prerender writes these into each HTML file
 * and the runtime applies the same list on navigation, so the crawler's page
 * and the visitor's page are one page.
 */

import { esc, jsonForScript } from './text'
import type { HeadTag, ResolvedPage, SiteConfig } from './types'

export const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
export const ROBOTS_NOINDEX = 'noindex, nofollow'

export function headTags(site: SiteConfig, page: ResolvedPage): HeadTag[] {
  const tags: HeadTag[] = []
  const meta = (attrs: Record<string, string>) => tags.push({ tag: 'meta', attrs })
  const noindex = page.noindex || site.indexable === false

  tags.push({ tag: 'title', attrs: {}, text: page.title })
  meta({ name: 'description', content: page.description })
  meta({ name: 'robots', content: noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX })

  if (!noindex) {
    tags.push({ tag: 'link', attrs: { rel: 'canonical', href: page.url } })
  }

  // Open Graph
  meta({ property: 'og:type', content: page.type })
  meta({ property: 'og:site_name', content: site.name })
  meta({ property: 'og:locale', content: site.locale ?? 'en_US' })
  meta({ property: 'og:title', content: page.title })
  meta({ property: 'og:description', content: page.description })
  meta({ property: 'og:url', content: page.url })
  meta({ property: 'og:image', content: page.image.url })
  if (page.image.width) meta({ property: 'og:image:width', content: String(page.image.width) })
  if (page.image.height) meta({ property: 'og:image:height', content: String(page.image.height) })
  meta({ property: 'og:image:alt', content: page.image.alt ?? page.title })

  if (page.type === 'article' && page.article) {
    const a = page.article
    if (a.publishedTime) meta({ property: 'article:published_time', content: a.publishedTime })
    if (a.modifiedTime ?? a.publishedTime) meta({ property: 'article:modified_time', content: (a.modifiedTime ?? a.publishedTime)! })
    if (a.author) meta({ property: 'article:author', content: a.author })
    if (a.section) meta({ property: 'article:section', content: a.section })
    for (const t of a.tags ?? []) meta({ property: 'article:tag', content: t })
  }

  // Twitter / X: name=, never property=
  meta({ name: 'twitter:card', content: 'summary_large_image' })
  if (site.twitter) meta({ name: 'twitter:site', content: site.twitter })
  meta({ name: 'twitter:title', content: page.title })
  meta({ name: 'twitter:description', content: page.description })
  meta({ name: 'twitter:image', content: page.image.url })
  meta({ name: 'twitter:image:alt', content: page.image.alt ?? page.title })

  // Verification, home page only
  if (page.path === '/') {
    if (site.verification?.google) meta({ name: 'google-site-verification', content: site.verification.google })
    if (site.verification?.bing) meta({ name: 'msvalidate.01', content: site.verification.bing })
  }

  // One JSON-LD graph per page
  if (!noindex && page.jsonLd.length) {
    tags.push({ tag: 'script', attrs: { type: 'application/ld+json' }, text: jsonForScript(page.jsonLd[0]) })
  }

  return tags
}

export function headHtml(site: SiteConfig, page: ResolvedPage): string {
  return headTags(site, page)
    .map((t) => {
      const attrs = Object.entries(t.attrs)
        .map(([k, v]) => ` ${k}="${esc(v)}"`)
        .join('')
      if (t.tag === 'title') return `<title>${esc(t.text ?? '')}</title>`
      if (t.tag === 'script') return `<script${attrs}>${t.text ?? ''}</script>`
      return `<${t.tag}${attrs}>`
    })
    .join('\n    ')
}

export const HEAD_OPEN = '<!-- apotome:seo -->'
export const HEAD_CLOSE = '<!-- /apotome:seo -->'

/**
 * Put a page's head into the built index.html template, replacing whatever the
 * template already said about title, description, robots, canonical, OG,
 * Twitter and JSON-LD, so the document never carries two of anything.
 */
export function injectHead(template: string, head: string, lang?: string): string {
  let out = template.replace(new RegExp(`${HEAD_OPEN}[\\s\\S]*?${HEAD_CLOSE}\\s*`, 'g'), '')
  out = out
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\s+name=["'](description|robots|googlebot|twitter:[^"']+|keywords)["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["'](og|article|twitter):[^"']+["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']alternate["'][^>]*hreflang[^>]*>\s*/gi, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>\s*/gi, '')
  if (lang) out = out.replace(/<html([^>]*?)\slang=["'][^"']*["']/i, `<html$1 lang="${lang}"`).replace(/<html(?![^>]*\slang=)/i, `<html lang="${lang}"`)
  const block = `${HEAD_OPEN}\n    ${head}\n    ${HEAD_CLOSE}`
  return /<\/head>/i.test(out) ? out.replace(/<\/head>/i, `    ${block}\n  </head>`) : `${block}\n${out}`
}
