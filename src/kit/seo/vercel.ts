/* vendored from apotome-seo 1.0.1; edit the source, then re-run vendor.mjs */
/**
 * The hosting config the standard requires (section 4.5), and a check that a
 * site's vercel.json matches it.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const VERCEL_REWRITE_SOURCE = '/((?!assets/|api/|.*\\.[a-zA-Z0-9]+$).*)'

export function vercelConfig(opts: { privatePrefixes?: string[]; redirects?: { source: string; destination: string; permanent?: boolean }[]; fallback?: 'index' | '404' } = {}) {
  const prefixes = (opts.privatePrefixes ?? ['admin', 'account', 'dashboard', 'checkout', 'order', 'portal', 'c']).map((p) => p.replace(/^\/|\/$/g, ''))
  return {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    cleanUrls: true,
    trailingSlash: false,
    ...(opts.redirects?.length ? { redirects: opts.redirects.map((r) => ({ permanent: true, ...r })) } : {}),
    rewrites: [{ source: VERCEL_REWRITE_SOURCE, destination: opts.fallback === '404' ? '/404.html' : '/index.html' }],
    headers: [
      { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] },
      { source: `/(${prefixes.join('|')})(/.*)?`, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ],
  }
}

export async function checkVercelConfig(root: string): Promise<string[]> {
  let raw: string
  try {
    raw = await readFile(path.join(root, 'vercel.json'), 'utf8')
  } catch {
    return ['no vercel.json; the SPA fallback, cleanUrls and headers are unset']
  }
  const warnings: string[] = []
  let cfg: Record<string, unknown>
  try {
    cfg = JSON.parse(raw)
  } catch {
    return ['vercel.json is not valid JSON']
  }
  if (cfg.cleanUrls !== true) warnings.push('cleanUrls is not true')
  if (cfg.trailingSlash !== false) warnings.push('trailingSlash is not false')
  const rewrites = (cfg.rewrites as { source: string; destination: string }[] | undefined) ?? []
  const catchAll = rewrites.find((r) => r.source === '/(.*)' || r.source === '/:path*')
  if (catchAll) warnings.push(`rewrite "${catchAll.source}" also catches robots.txt, sitemap.xml and every missing file; use ${VERCEL_REWRITE_SOURCE}`)
  const headers = (cfg.headers as { source: string; headers: { key: string }[] }[] | undefined) ?? []
  if (!headers.some((h) => h.headers.some((x) => x.key.toLowerCase() === 'x-robots-tag'))) warnings.push('no X-Robots-Tag header on private paths')
  if (!headers.some((h) => h.source.includes('assets') && h.headers.some((x) => x.key.toLowerCase() === 'cache-control'))) warnings.push('no immutable Cache-Control on /assets')
  return warnings
}
