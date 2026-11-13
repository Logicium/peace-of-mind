/* vendored from apotome-seo 1.0.1; edit the source, then re-run vendor.mjs */
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/**
 * The browser half: keep the head honest as the router moves.
 *
 * The prerender wrote the right head into every file. Once the app hydrates
 * and the visitor clicks through, this applies the same tags for the new route
 * from the same resolver, so a share sheet, a bookmark or Google's renderer
 * sees the page it is on. Everything it adds is marked `data-seo`, so it only
 * ever replaces its own work.
 *
 *   installSeo(router, site)                      // once, beside the router
 *   useSeoData(() => post.value)                  // in a dynamic page, when its record loads
 */

import { getCurrentInstance, onBeforeUnmount, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { headTags } from './head'
import { resolvePage } from './resolve'
import type { ResolvedPage, SiteConfig } from './types'

const OWNED = 'data-seo'
let installedSite: SiteConfig | null = null
let currentRoute: RouteLocationNormalizedLoaded | null = null

export function applyHead(site: SiteConfig, page: ResolvedPage): void {
  if (typeof document === 'undefined') return
  for (const el of Array.from(document.head.querySelectorAll(`[${OWNED}]`))) el.remove()
  // the template's own tags, if the prerender did not already strip them
  for (const el of Array.from(document.head.querySelectorAll('meta[name="description"], meta[name="robots"], link[rel="canonical"], meta[property^="og:"], meta[property^="article:"], meta[name^="twitter:"], script[type="application/ld+json"]'))) {
    if (!el.hasAttribute(OWNED)) el.remove()
  }
  for (const tag of headTags(site, page)) {
    if (tag.tag === 'title') {
      document.title = tag.text ?? ''
      continue
    }
    const el = document.createElement(tag.tag)
    for (const [k, v] of Object.entries(tag.attrs)) el.setAttribute(k, v)
    if (tag.text) el.textContent = tag.text
    el.setAttribute(OWNED, '')
    document.head.appendChild(el)
  }
  document.documentElement.lang = site.lang ?? 'en'
}

export function resolveRoute(site: SiteConfig, route: RouteLocationNormalizedLoaded, data?: unknown): ResolvedPage {
  const matched = [...route.matched].reverse().find((r) => r.meta?.seo) ?? route.matched[route.matched.length - 1]
  const params: Record<string, string> = {}
  for (const [k, v] of Object.entries(route.params)) params[k] = Array.isArray(v) ? v.join('/') : String(v)
  return resolvePage(site, matched?.meta?.seo, { site, path: route.path, params, data })
}

/** Apply the route's static SEO on every navigation. */
export function installSeo(router: Router, site: SiteConfig): void {
  installedSite = site
  router.afterEach((to) => {
    currentRoute = to as RouteLocationNormalizedLoaded
    // a dynamic route with no data yet gets its static fields; the page
    // completes them through useSeoData once its record arrives
    applyHead(site, resolveRoute(site, currentRoute))
  })
}

/**
 * In a page whose head depends on fetched data: re-apply when the data lands.
 * Pass a ref, a getter or a plain object.
 */
export function useSeoData<T>(data: MaybeRefOrGetter<T | null | undefined>): void {
  const site = installedSite
  if (!site) {
    if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) console.warn('[seo] useSeoData called before installSeo')
    return
  }
  const stop = watch(
    () => toValue(data),
    (d) => {
      if (d && currentRoute) applyHead(site, resolveRoute(site, currentRoute, d))
    },
    { immediate: true },
  )
  if (getCurrentInstance()) onBeforeUnmount(stop)
}

/** Apply an explicit page, for sites that route by hand. */
export function applyPage(site: SiteConfig, page: ResolvedPage): void {
  applyHead(site, page)
}
