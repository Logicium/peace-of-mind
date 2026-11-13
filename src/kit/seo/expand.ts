/* vendored from apotome-seo 1.3.0; edit the source, then re-run vendor.mjs */
/**
 * From the route table to the list of pages to prerender.
 *
 * Walks nested routes, joins paths, skips redirects, catch-alls and private
 * prefixes, and asks each dynamic route for its instances through `expand`.
 * A dynamic route without `expand` is reported and skipped: it cannot be
 * indexed, so the build says so instead of silently leaving it out.
 */

import type { RouteRecordRaw } from 'vue-router'
import { isPrivatePath, resolvePage } from './resolve'
import { normalizePath } from './text'
import type { ExpandContext, ResolvedPage, RouteSeo, SiteConfig } from './types'

export interface FlatRoute {
  path: string
  seo?: RouteSeo
  name?: string
}

export function flattenRoutes(routes: readonly RouteRecordRaw[], parent = ''): FlatRoute[] {
  const out: FlatRoute[] = []
  for (const r of routes) {
    if ('redirect' in r && r.redirect && !r.component && !r.children) continue
    const full = r.path.startsWith('/') ? r.path : normalizePath(`${parent}/${r.path}`)
    const seo = (r.meta as { seo?: RouteSeo } | undefined)?.seo
    if (r.children?.length) {
      // a parent with its own component and seo is a page too
      if (r.component && seo) out.push({ path: full, seo, name: String(r.name ?? '') })
      out.push(...flattenRoutes(r.children, full))
      continue
    }
    out.push({ path: full, seo, name: r.name ? String(r.name) : undefined })
  }
  return out
}

const isDynamic = (path: string) => /[:*(]/.test(path)
const isCatchAll = (path: string) => /pathMatch|\(\.\*\)|\*/.test(path)

export function fillParams(pattern: string, params: Record<string, string>): string {
  return normalizePath(
    pattern.replace(/:([A-Za-z0-9_]+)(\([^)]*\))?([?+*])?/g, (_m, name: string) => {
      const v = params[name]
      if (v === undefined) throw new Error(`[seo] route ${pattern} expanded without a value for :${name}`)
      return v
    }),
  )
}

export interface ExpandReport {
  pages: ResolvedPage[]
  skipped: { path: string; reason: string }[]
}

export async function expandRoutes(site: SiteConfig, routes: readonly RouteRecordRaw[], ctx: ExpandContext): Promise<ExpandReport> {
  const flat = flattenRoutes(routes)
  const pages: ResolvedPage[] = []
  const skipped: ExpandReport['skipped'] = []
  const seen = new Set<string>()

  for (const r of flat) {
    if (isCatchAll(r.path)) continue
    if (isPrivatePath(site, r.path.split('/:')[0]!)) {
      skipped.push({ path: r.path, reason: 'private prefix' })
      continue
    }
    if (isDynamic(r.path)) {
      if (!r.seo?.expand) {
        skipped.push({ path: r.path, reason: 'dynamic route without seo.expand' })
        continue
      }
      const instances = await r.seo.expand(ctx)
      for (const inst of instances) {
        const path = fillParams(r.path, inst.params)
        if (seen.has(path)) continue
        seen.add(path)
        pages.push(resolvePage(site, r.seo, { site, path, params: inst.params, data: inst.data }))
      }
      continue
    }
    if (seen.has(r.path)) continue
    seen.add(r.path)
    if (!r.seo) skipped.push({ path: r.path, reason: 'no seo record (rendered with site defaults)' })
    pages.push(resolvePage(site, r.seo, { site, path: r.path, params: {}, data: undefined }))
  }
  // home first, then by path, so the sitemap and llms.txt read in order
  pages.sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)))
  return { pages, skipped }
}
