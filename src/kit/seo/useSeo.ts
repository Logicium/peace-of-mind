/**
 * The runtime half: keep the head honest as the client-side router moves.
 *
 * The build stamped the right tags into every file, which is what a crawler
 * reads. Once the app hydrates and the visitor clicks through, that head is
 * stale for every page after the first, and so is what a share sheet or a
 * bookmark picks up. This applies the same tags the build wrote, from the
 * same functions, so the two can never say different things.
 *
 * Everything it touches is marked `data-apotome-seo`, so it only ever
 * replaces its own work and never the site's own hand-written tags.
 */

import { headTags } from './head'
import { pageFor, type SeoSettings } from './types'

const OWNED = 'data-apotome-seo'

/** Apply one path's tags to the live document. */
export function applySeo(settings: SeoSettings | null, path: string): void {
  if (!settings || typeof document === 'undefined') return
  const page = pageFor(settings, path)

  for (const el of Array.from(document.head.querySelectorAll(`[${OWNED}]`))) el.remove()

  for (const tag of headTags(settings, page)) {
    if (tag.tag === 'title') {
      // the title element is the one tag a site always already has, so it is
      // updated in place rather than replaced: swapping it flickers the tab
      document.title = tag.text ?? ''
      continue
    }
    const el = document.createElement(tag.tag)
    for (const [k, v] of Object.entries(tag.attrs)) el.setAttribute(k, v)
    if (tag.text) el.textContent = tag.text
    el.setAttribute(OWNED, '')
    document.head.appendChild(el)
  }

  if (settings.locale) {
    document.documentElement.lang = settings.locale.split(/[_-]/)[0] ?? 'en'
  }
}

/**
 * Wire it to a vue-router instance.
 *
 * Call once, next to the router. Settings are the ones compiled into the site
 * by the build; passing null makes this a no-op, so a site can wire it before
 * its first publish without a guard at the call site.
 *
 *   import { installSeo } from './kit/seo'
 *   import seo from './seo.published.json'
 *   installSeo(router, seo)
 */
export function installSeo(
  router: { afterEach: (fn: (to: { path: string }) => void) => void },
  settings: SeoSettings | null,
): void {
  if (!settings) return
  router.afterEach((to) => applySeo(settings, to.path))
}
