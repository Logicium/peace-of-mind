/* vendored from apotome-seo 1.0.1; edit the source, then re-run vendor.mjs */
/** String helpers shared by the browser and Node halves. */

import type { SeoImage, SiteConfig } from './types'

export function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function escXml(value: string): string {
  return esc(value).replace(/'/g, '&apos;')
}

/** Collapse whitespace and cut at a word boundary with an ellipsis. */
export function truncate(s: string, max = 160): string {
  const clean = s.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

export function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li|article|main|section|div|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim()
}

/** "/about/" -> "/about", "" -> "/" */
export function normalizePath(input: string): string {
  let p = (input || '/').split('#')[0]!.split('?')[0]!
  if (!p.startsWith('/')) p = `/${p}`
  p = p.replace(/\/{2,}/g, '/')
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p || '/'
}

export function absUrl(site: SiteConfig, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const base = site.siteUrl.replace(/\/+$/, '')
  const p = normalizePath(pathOrUrl)
  return p === '/' ? `${base}/` : `${base}${p}`
}

export function absImage(site: SiteConfig, image: SeoImage | string | undefined): SeoImage {
  const fallback = site.image
  const img: SeoImage = !image ? fallback : typeof image === 'string' ? { url: image } : image
  return {
    url: absUrl(site, img.url),
    width: img.width ?? (img.url === fallback.url ? fallback.width : undefined),
    height: img.height ?? (img.url === fallback.url ? fallback.height : undefined),
    alt: img.alt ?? (img.url === fallback.url ? fallback.alt : undefined),
  }
}

export function titleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/** Serialise JSON for a <script> body: the only sequence that can end it early is "</". */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** "Menu · Brand" -> "Menu" */
export function stripBrand(site: SiteConfig, title: string): string {
  return title.replace(new RegExp(`\\s*[·|]\\s*${escapeRe(site.name)}\\s*$`), '')
}
