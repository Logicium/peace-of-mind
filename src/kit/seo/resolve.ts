/* vendored from apotome-seo 1.3.0; edit the source, then re-run vendor.mjs */
/**
 * From a route and its context to a ResolvedPage.
 *
 * Shared by the prerender (Node) and the runtime (browser). Titles follow the
 * standard's pattern, descriptions are clamped to 160 characters, private
 * prefixes force noindex, and the JSON-LD graph is assembled from the entity,
 * the WebSite, the page, the breadcrumb and whatever the route adds.
 */

import { breadcrumbNode, entityId, entityNode, graph, isPerson, profilePageNode, webPageNode, websiteNode } from './schema'
import { absImage, absUrl, normalizePath, titleCase, truncate } from './text'
import { privatePrefixes } from './robots'
import type { Crumb, PageContext, ResolvedPage, RouteSeo, SiteConfig } from './types'

/**
 * A field's value: the value itself, or the function applied to the context.
 *
 * When `lenient` is set (a dynamic route whose record has not loaded yet, as on
 * a client-side visit before the page fetches it), a field that throws reads as
 * unset, so the head falls back to the site defaults until useSeoData supplies
 * the record. At build every instance has its record, so errors still surface.
 */
function val<T>(v: T | ((ctx: PageContext) => T) | undefined, ctx: PageContext, lenient = false): T | undefined {
  if (typeof v !== 'function') return v
  if (!lenient) return (v as (c: PageContext) => T)(ctx)
  try {
    return (v as (c: PageContext) => T)(ctx)
  } catch {
    return undefined
  }
}

export function isPrivatePath(site: SiteConfig, path: string): boolean {
  const p = normalizePath(path)
  return privatePrefixes(site).some((prefix) => {
    const clean = prefix.replace(/\/+$/, '')
    return p === clean || p.startsWith(`${clean}/`)
  })
}

export function homeTitle(site: SiteConfig): string {
  return site.tagline ? `${site.name} · ${site.tagline}` : site.name
}

export function pageTitle(site: SiteConfig, title: string | undefined, path: string): string {
  if (path === '/' && !title) return homeTitle(site)
  if (!title) return site.name
  if (path === '/') return title
  const template = site.titleTemplate ?? ((t: string) => `${t} · ${site.name}`)
  // a title that already names the brand is left alone
  if (title.includes(site.name)) return title
  const full = template(title)
  // past what a result shows, the suffix is what gets cut: drop it and keep the subject whole
  return full.length > MAX_TITLE ? title : full
}

/** Characters a search result shows before it truncates a title. */
export const MAX_TITLE = 65

export function crumbsFromPath(path: string, lastName?: string): Crumb[] {
  const parts = normalizePath(path).split('/').filter(Boolean)
  return parts.map((part, i) => {
    const last = i === parts.length - 1
    return { name: last && lastName ? lastName : titleCase(part), path: last ? undefined : `/${parts.slice(0, i + 1).join('/')}` }
  })
}

export function resolvePage(site: SiteConfig, seo: RouteSeo | undefined, ctx: PageContext): ResolvedPage {
  const path = normalizePath(ctx.path)
  const s = seo ?? {}
  // a dynamic route visited before its record has loaded
  const waiting = Boolean(s.expand) && (ctx.data === undefined || ctx.data === null)
  const v = <T>(field: T | ((c: PageContext) => T) | undefined) => val(field, ctx, waiting)
  const rawTitle = v(s.title)
  const title = pageTitle(site, rawTitle, path)
  const description = truncate(v(s.description) || site.description, 160)
  const image = absImage(site, v(s.image))
  const type = v(s.type) ?? (path === '/' && isPerson(site.entity.type) ? 'profile' : 'website')
  const noindex = Boolean(v(s.noindex)) || isPrivatePath(site, path) || site.indexable === false
  const lastmod = v(s.lastmod)
  const article = v(s.article)
  const url = absUrl(site, path)

  let jsonLd: object[] = []
  if (!noindex) {
    const nodes: (object | undefined)[] = []
    if (path === '/') {
      nodes.push(entityNode(site), websiteNode(site))
      if (isPerson(site.entity.type)) nodes.push(profilePageNode(site, '/'))
    } else {
      nodes.push(webPageNode(site, { path, title, description, image, type, lastmod }))
      const bc = v(s.breadcrumb)
      const crumbs: Crumb[] =
        bc === undefined
          ? crumbsFromPath(path, rawTitle)
          : (bc as (Crumb | string)[]).map((c, i, a) => (typeof c === 'string' ? { name: c, path: i === a.length - 1 ? undefined : crumbsFromPath(path)[i]?.path } : c))
      nodes.push(breadcrumbNode(site, path, crumbs))
    }
    const extra = waiting ? undefined : s.schema?.(ctx)
    if (extra) nodes.push(...(Array.isArray(extra) ? extra : [extra]))
    if (site.extraJsonLd) nodes.push(...site.extraJsonLd)
    // the entity is referenced by @id from every page; include the node itself on
    // the home page only, where engines look for it
    jsonLd = [graph(nodes.filter((n) => n && (path === '/' || (n as { '@id'?: string })['@id'] !== entityId(site))))]
  }

  const body = waiting ? undefined : s.body?.(ctx)
  const sitemapImage = v(s.sitemapImage)
  return { path, url, title, description, image, type, noindex, jsonLd, lastmod, article, body, sitemapImage: sitemapImage ? absImage(site, sitemapImage) : undefined }
}
