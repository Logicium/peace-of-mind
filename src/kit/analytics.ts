/**
 * Apotome Labs analytics beacon - drop-in, framework-agnostic, cookieless.
 *
 * Vendor this single file into any client site (keep the path
 * `src/kit/analytics.ts`) and initialize it once at boot:
 *
 *   import { initApotomeAnalytics } from '@/kit/analytics'
 *   initApotomeAnalytics({
 *     siteKey: import.meta.env.VITE_ANALYTICS_SITE_KEY,
 *     apiUrl: import.meta.env.VITE_API_URL,
 *     router,            // optional: a vue-router instance
 *   })
 *
 * Rules it lives by:
 *  - No cookies, no localStorage, no client-side identifier of any kind.
 *    Visitor de-duplication happens server-side with a daily-rotating hash.
 *  - Analytics never throws into the app and never blocks navigation:
 *    sendBeacon first, keepalive fetch as fallback, silence on failure.
 *  - Inert unless both siteKey and apiUrl are present, so local dev and
 *    unprovisioned deployments send nothing.
 */

interface RouterLike {
  afterEach: (hook: (to: { path: string }) => void) => void
}

export interface ApotomeAnalyticsOptions {
  siteKey?: string
  apiUrl?: string
  /** vue-router (or anything with afterEach); omit to patch history instead */
  router?: RouterLike
}

let lastPath = ''

function send(apiUrl: string, siteKey: string, path: string): void {
  const url = `${apiUrl.replace(/\/$/, '')}/api/collect/${encodeURIComponent(siteKey)}`
  const body = JSON.stringify({ path, referrer: document.referrer || undefined })
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    } else {
      void fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      })
    }
  } catch {
    /* analytics never throws */
  }
}

export function initApotomeAnalytics(options: ApotomeAnalyticsOptions): void {
  const { siteKey, apiUrl, router } = options
  if (!siteKey || !apiUrl || typeof window === 'undefined') return

  const record = (path: string) => {
    if (path === lastPath) return
    lastPath = path
    send(apiUrl, siteKey, path)
  }

  // first paint
  record(window.location.pathname)

  if (router) {
    router.afterEach((to) => record(to.path))
    return
  }

  // no router: watch the History API + back/forward
  const patch = (name: 'pushState' | 'replaceState') => {
    const original = history[name].bind(history)
    history[name] = ((...args: Parameters<History['pushState']>) => {
      original(...args)
      record(window.location.pathname)
    }) as History['pushState']
  }
  patch('pushState')
  patch('replaceState')
  window.addEventListener('popstate', () => record(window.location.pathname))
}
