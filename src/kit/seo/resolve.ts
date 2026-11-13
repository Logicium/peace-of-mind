/* vendored from apotome-seo 1.0.1; edit the source, then re-run vendor.mjs */
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

const val = <T>(v: T | ((ctx: PageContext) => T) | undefined, ctx: PageContext): T | undefined =>
  typeof v === 'function' ? (v as (c: PageContext) => T)(ctx) : v

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
  const rawTitle = val(s.title, ctx)
  const title = pageTitle(site, rawTitle, path)
  const description = truncate(val(s.description, ctx) || site.description, 160)
  const image = absImage(site, val(s.image, ctx))
  const type = val(s.type, ctx) ?? (path === '/' && isPerson(site.entity.type) ? 'profile' : 'website')
  const noindex = Boolean(val(s.noindex, ctx)) || isPrivatePath(site, path) || site.indexable === false
  const lastmod = val(s.lastmod, ctx)
  const article = val(s.article, ctx)
  const url = absUrl(site, path)

  let jsonLd: object[] = []
  if (!noindex) {
    const nodes: (object | undefined)[] = []
    if (path === '/') {
      nodes.push(entityNode(site), websiteNode(site))
      if (isPerson(site.entity.type)) nodes.push(profilePageNode(site, '/'))
    } else {
      nodes.push(webPageNode(site, { path, title, description, image, type, lastmod }))
      const bc = val(s.breadcrumb, ctx)
      const crumbs: Crumb[] =
        bc === undefined
          ? crumbsFromPath(path, rawTitle)
          : (bc as (Crumb | string)[]).map((c, i, a) => (typeof c === 'string' ? { name: c, path: i === a.length - 1 ? undefined : crumbsFromPath(path)[i]?.path } : c))
      nodes.push(breadcrumbNode(site, path, crumbs))
    }
    const extra = s.schema?.(ctx)
    if (extra) nodes.push(...(Array.isArray(extra) ? extra : [extra]))
    if (site.extraJsonLd) nodes.push(...site.extraJsonLd)
    // the entity is referenced by @id from every page; include the node itself on
    // the home page only, where engines look for it
    jsonLd = [graph(nodes.filter((n) => n && (path === '/' || (n as { '@id'?: string })['@id'] !== entityId(site))))]
  }

  const body = s.body?.(ctx)
  const sitemapImage = val(s.sitemapImage, ctx)
  return { path, url, title, description, image, type, noindex, jsonLd, lastmod, article, body, sitemapImage: sitemapImage ? absImage(site, sitemapImage) : undefined }
}
