/* vendored from apotome-seo 1.0.1; edit the source, then re-run vendor.mjs */
/**
 * The postbuild step: one HTML file per public route, plus sitemap.xml,
 * robots.txt, llms.txt, 404.html and a report. Section 13.3 of the standard.
 *
 *   // scripts/prerender.ts, run by "postbuild": "vite-node scripts/prerender.ts"
 *   import { prerender } from '../src/seo/node'
 *   import { site } from '../src/seo.site'
 *   import { routes } from '../src/routes'
 *   await prerender({ site, routes, root: new URL('..', import.meta.url) })
 *
 * Fails the build on an empty or duplicate title, a missing description, a
 * share image that is not in dist, a placeholder in the schema, or an empty
 * <html lang>. A build that cannot reach the content API fails loudly.
 */

import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RouteRecordRaw } from 'vue-router'
import { snapshotBodies, type SnapshotOptions } from './browser'
import { expandRoutes } from './expand'
import { headHtml, injectHead } from './head'
import { resolvePage } from './resolve'
import { buildRobots } from './robots'
import { buildLlmsFullTxt, buildLlmsTxt, buildSitemap } from './sitemap'
import { esc, normalizePath, stripBrand } from './text'
import type { ResolvedPage, SiteConfig } from './types'
import { checkVercelConfig } from './vercel'

export interface PrerenderOptions {
  site: SiteConfig
  routes: readonly RouteRecordRaw[]
  /** the project root (holds dist/, public/, vercel.json) */
  root: string | URL
  dist?: string
  /** where `expand` fetches from; defaults to process.env.VITE_API_URL */
  apiUrl?: string
  /**
   * How bodies are produced for routes with no `seo.body`:
   *  - 'floor': h1 + description + site navigation (default)
   *  - 'browser': headless snapshot of the built app, falling back to floor
   */
  render?: 'floor' | 'browser'
  snapshot?: SnapshotOptions
  /** write llms-full.txt (sites with a journal or documentation) */
  llmsFull?: boolean
  /** file layout: "/about" -> about.html (Vercel cleanUrls) or about/index.html */
  layout?: 'clean' | 'directory'
  /** the <title> text the 404 page should carry */
  notFoundTitle?: string
  /** skip the vercel.json check (other hosts) */
  skipVercelCheck?: boolean
  /**
   * Keep the #app body a previous step already wrote into each route's file
   * (vite-ssg, another prerender) and only replace the head. Routes with no
   * existing file still get a body from `seo.body`, the browser, or the floor.
   */
  preserveBodies?: boolean
  log?: (line: string) => void
}

export interface PrerenderResult {
  pages: ResolvedPage[]
  written: string[]
  skipped: { path: string; reason: string }[]
  warnings: string[]
}

const VITE_TITLE = /^\s*(Vite App|Vite \+ Vue|Document)\s*$/i

export async function prerender(opts: PrerenderOptions): Promise<PrerenderResult> {
  const log = opts.log ?? ((l: string) => console.log(l))
  const root = typeof opts.root === 'string' ? opts.root : fileURLToPath(opts.root)
  const dist = opts.dist ?? path.join(root, 'dist')
  const site = opts.site
  const warnings: string[] = []
  const errors: string[] = []

  const template = emptyAppDiv(await readFile(path.join(dist, 'index.html'), 'utf8'))
  if (/<html[^>]*\slang=["']\s*["']/i.test(template)) errors.push('index.html has an empty <html lang>; set lang="en"')
  if (!/<meta\s+name=["']viewport["']/i.test(template)) errors.push('index.html has no viewport meta')
  if (!/^https:\/\/[^/]+$/.test(site.siteUrl)) errors.push(`siteUrl must be an https origin with no path or trailing slash: "${site.siteUrl}"`)

  const { pages, skipped } = await expandRoutes(site, opts.routes, {
    site,
    apiUrl: opts.apiUrl ?? process.env.VITE_API_URL,
    fetch: globalThis.fetch,
  })
  for (const s of skipped) if (s.reason.startsWith('dynamic')) warnings.push(`${s.path}: ${s.reason}`)

  // validation
  const titles = new Map<string, string>()
  for (const p of pages) {
    if (p.noindex) continue
    if (!p.title.trim() || VITE_TITLE.test(p.title)) errors.push(`${p.path}: empty or default title`)
    if (!p.description.trim()) errors.push(`${p.path}: empty description`)
    if (p.description === site.description && p.path !== '/') warnings.push(`${p.path}: uses the site-wide description`)
    if (p.title.length > 70) warnings.push(`${p.path}: title is ${p.title.length} characters even without the brand suffix`)
    const dup = titles.get(p.title)
    if (dup) errors.push(`${p.path}: duplicate title with ${dup} ("${p.title}")`)
    titles.set(p.title, p.path)
    if (p.image.url.startsWith(site.siteUrl)) {
      const file = path.join(dist, decodeURIComponent(p.image.url.slice(site.siteUrl.length)))
      try {
        await access(file)
      } catch {
        errors.push(`${p.path}: share image ${p.image.url} is not in dist`)
      }
    }
  }
  if (errors.length) {
    throw new Error(`[seo] ${errors.length} error${errors.length === 1 ? '' : 's'}:\n  - ${errors.join('\n  - ')}`)
  }

  // bodies
  if (opts.preserveBodies) {
    for (const p of pages) {
      if (p.body) continue
      const existing = await readFile(fileFor(dist, p.path, opts.layout ?? 'clean'), 'utf8').catch(() => null)
      const body = existing ? appDivContent(existing) : null
      if (body && body.trim().length > 200) p.body = body
    }
  }
  const needBody = pages.filter((p) => !p.body && !p.noindex)
  if (opts.render === 'browser' && needBody.length) {
    // write head-only files first so the browser loads a document per route
    await writeAll(dist, template, site, pages, opts.layout ?? 'clean')
    let shots: Map<string, string> | null = null
    try {
      shots = await snapshotBodies(dist, needBody.map((p) => p.path), { ...opts.snapshot, log })
      if (!shots) warnings.push('render: "browser" requested but neither puppeteer nor puppeteer-core+@sparticuz/chromium is installed; used floor bodies')
    } catch (err) {
      // a browser that will not launch on this machine is not a reason to ship no site
      warnings.push(`browser snapshot failed (${err instanceof Error ? err.message.split('\n')[0] : err}); used floor bodies`)
    }
    for (const p of needBody) {
      const shot = shots?.get(p.path)
      p.body = shot && shot.length > 200 ? shot : floorBody(site, p, pages)
      if (!shot || shot.length <= 200) warnings.push(`${p.path}: browser snapshot empty, used floor body`)
    }
  } else {
    for (const p of needBody) p.body = floorBody(site, p, pages)
  }

  const written = await writeAll(dist, template, site, pages, opts.layout ?? 'clean')

  // 404
  const notFound = resolvePage(site, { title: opts.notFoundTitle ?? 'Page not found', description: `That page is not on ${site.name}.`, noindex: true }, { site, path: '/404', params: {}, data: undefined })
  notFound.body = `<main><h1>Page not found</h1><p>That page is not on ${esc(site.name)}.</p>${navList(site, pages)}</main>`
  await writeFile(path.join(dist, '404.html'), withAppBody(injectHead(template, headHtml(site, notFound), site.lang ?? 'en'), notFound.body), 'utf8')

  await writeFile(path.join(dist, 'sitemap.xml'), buildSitemap(site, pages), 'utf8')
  await writeFile(path.join(dist, 'robots.txt'), buildRobots(site), 'utf8')
  await writeFile(path.join(dist, 'llms.txt'), buildLlmsTxt(site, pages), 'utf8')
  if (opts.llmsFull) await writeFile(path.join(dist, 'llms-full.txt'), buildLlmsFullTxt(site, pages), 'utf8')

  if (!opts.skipVercelCheck) {
    for (const w of await checkVercelConfig(root)) warnings.push(`vercel.json: ${w}`)
  }

  const report = {
    generatedAt: new Date().toISOString(),
    site: site.siteUrl,
    pages: pages.map((p) => ({ path: p.path, title: p.title, noindex: p.noindex, lastmod: p.lastmod ?? null, bodyChars: p.body?.length ?? 0 })),
    skipped,
    warnings,
  }
  await writeFile(path.join(dist, 'seo-report.json'), JSON.stringify(report, null, 2), 'utf8')

  const indexable = pages.filter((p) => !p.noindex).length
  log(`[seo] ${written.length} pages written (${indexable} indexable), sitemap.xml, robots.txt, llms.txt${opts.llmsFull ? ', llms-full.txt' : ''}, 404.html`)
  for (const w of warnings) log(`[seo] warning: ${w}`)
  return { pages, written, skipped, warnings }
}

function navList(site: SiteConfig, pages: ResolvedPage[]): string {
  const top = pages.filter((p) => !p.noindex && p.path.split('/').length <= 2).slice(0, 12)
  return `<nav aria-label="Site"><ul>${top.map((p) => `<li><a href="${esc(p.path)}">${esc(stripBrand(site, p.title))}</a></li>`).join('')}</ul></nav>`
}

/** The minimum readable page: heading, description, navigation. */
export function floorBody(site: SiteConfig, page: ResolvedPage, all: ResolvedPage[]): string {
  const h1 = page.path === '/' ? site.name : stripBrand(site, page.title)
  return `<main><h1>${esc(h1)}</h1><p>${esc(page.description)}</p>${navList(site, all)}</main>`
}

async function writeAll(dist: string, template: string, site: SiteConfig, pages: ResolvedPage[], layout: 'clean' | 'directory'): Promise<string[]> {
  const written: string[] = []
  for (const p of pages) {
    const file = fileFor(dist, p.path, layout)
    await mkdir(path.dirname(file), { recursive: true })
    let html = injectHead(template, headHtml(site, p), site.lang ?? 'en')
    if (p.body) html = withAppBody(html, p.body)
    await writeFile(file, html, 'utf8')
    written.push(path.relative(dist, file).split(path.sep).join('/'))
  }
  return written
}

export function fileFor(dist: string, routePath: string, layout: 'clean' | 'directory'): string {
  const p = normalizePath(routePath)
  if (p === '/') return path.join(dist, 'index.html')
  return layout === 'clean' ? path.join(dist, `${p.slice(1)}.html`) : path.join(dist, p.slice(1), 'index.html')
}

/** The bounds of the #app element's content, by counting nested divs. */
function appDivBounds(html: string): { start: number; end: number } | null {
  const open = html.search(/<div\s+id=["']app["'][^>]*>/i)
  if (open < 0) return null
  const start = html.indexOf('>', open) + 1
  const re = /<div|<\/div>/gi
  re.lastIndex = start
  let depth = 1
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    depth += m[0].toLowerCase().startsWith('</') ? -1 : 1
    if (depth === 0) return { start, end: m.index }
  }
  return null
}

export function appDivContent(html: string): string | null {
  const b = appDivBounds(html)
  return b ? html.slice(b.start, b.end) : null
}

export function emptyAppDiv(html: string): string {
  const b = appDivBounds(html)
  return b ? `${html.slice(0, b.start)}${html.slice(b.end)}` : html
}

export function withAppBody(html: string, body: string): string {
  const b = appDivBounds(html)
  return b ? `${html.slice(0, b.start)}${body}${html.slice(b.end)}` : html
}
