/**
 * Fetching the published settings, at build time or at runtime.
 *
 * Same rule as the rest of the kit: never throw into the host site, never
 * wait forever. A build that cannot reach the studio writes the site it
 * already had; a page that cannot reach the studio renders the tags that were
 * compiled in. Both are the correct failure.
 */

import type { SeoSettings } from './types'

const TIMEOUT_MS = 10_000

export interface SeoSource {
  siteKey: string
  apiUrl: string
}

/**
 * Reads the environment the same way the rest of the kit does.
 *
 * Duplicated from `env.ts` rather than imported, because this module runs
 * inside build scripts where `import.meta.env` is not Vite's: a postbuild
 * step under vite-node reads `process.env` instead, and the site's `.env` is
 * loaded by the script that calls it.
 */
export function seoSourceFromEnv(env: Record<string, string | undefined> = readEnv()): SeoSource | null {
  const siteKey = pick(env.VITE_APOTOME_SITE_KEY, env.VITE_ANALYTICS_SITE_KEY)
  const apiUrl = pick(env.VITE_APOTOME_API_URL, env.VITE_API_URL)
  if (!siteKey || !apiUrl) return null
  return { siteKey, apiUrl: apiUrl.replace(/\/$/, '') }
}

/** The published settings, or null for every reason there might not be any. */
export async function fetchPublishedSeo(source: SeoSource | null): Promise<SeoSettings | null> {
  if (!source) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${source.apiUrl}/api/seo/${encodeURIComponent(source.siteKey)}`, {
      signal: controller.signal,
    })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: SeoSettings | null } | SeoSettings | null
    const data = body && typeof body === 'object' && 'data' in body ? body.data : body
    // a site whose settings were never published comes back as a null payload
    return data && typeof data === 'object' && Array.isArray((data as SeoSettings).pages)
      ? (data as SeoSettings)
      : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function readEnv(): Record<string, string | undefined> {
  const fromVite =
    typeof import.meta !== 'undefined'
      ? ((import.meta as unknown as { env?: Record<string, string> }).env ?? {})
      : {}
  // reached through globalThis rather than the bare name: this file is
  // compiled once for the browser, where `process` does not exist and its
  // types are not loaded, and once for the build script, where it does
  const node = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  return { ...(node?.env ?? {}), ...fromVite }
}

function pick(...values: (string | undefined)[]): string | undefined {
  for (const v of values) if (typeof v === 'string' && v.trim()) return v.trim()
  return undefined
}
