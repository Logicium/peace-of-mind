/* vendored from apotome-seo 1.4.2; edit the source, then re-run vendor.mjs */
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
  // a page whose body a previous step rendered keeps that step's whole file as
  // its base, so its own stylesheets and preloads survive; only the head changes
  const bases = new Map<string, string>()
  if (opts.preserveBodies) {
    for (const p of pages) {
      if (p.body) continue
      const existing = await readFile(fileFor(dist, p.path, opts.layout ?? 'clean'), 'utf8').catch(() => null)
      const body = existing ? appDivContent(existing) : null
      if (existing && body && body.trim().length > 200) {
        p.body = body
        bases.set(p.path, existing)
      }
    }
  }
  // static components rendered under Node: no browser, the same markup the page mounts
  try {
    for (const p of pages) {
      if (p.body || p.noindex || !p.bodyComponent) continue
      try {
        p.body = await renderStatic(p.bodyComponent, p.bodyProps, p.path, root)
      } catch (err) {
        warnings.push(`${p.path}: bodyComponent could not render under Node (${err instanceof Error ? err.message.split('\n')[0] : err})`)
      }
    }
  } finally {
    // the loader is a Vite server; left open it would hold the build process
    await closeStaticLoader()
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
    const missed: string[] = []
    for (const p of needBody) {
      const shot = shots?.get(p.path)
      if (shot && shot.length > 200) p.body = shot
      else missed.push(p.path)
    }
    // On a build server a browser that is not there or will not run is not a
    // passing build with a warning: it is a site shipping empty pages without
    // anyone looking. Fail and say what to do instead. Locally, fall back.
    if (missed.length && onBuildServer()) {
      throw new Error(
        `[seo] render: "browser" produced no body for ${missed.length} page(s) on this build server (${missed.join(', ')}). ` +
          'Hosted build images usually cannot run Chrome. Build those bodies from data with seo.body instead.',
      )
    }
  }
  const floored: string[] = []
  for (const p of pages) {
    if (p.body || p.noindex) continue
    p.body = floorBody(site, p, pages)
    floored.push(p.path)
  }
  if (floored.length) {
    warnings.push(`${floored.length} indexable page(s) ship only a heading, description and links, with no seo.body: ${floored.join(', ')}`)
  }

  const written = await writeAll(dist, template, site, pages, opts.layout ?? 'clean', bases)

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
    pages: pages.map((p) => ({ path: p.path, title: p.title, noindex: p.noindex, lastmod: p.lastmod ?? null, bodyChars: p.body?.length ?? 0, floorBody: floored.includes(p.path) })),
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

/**
 * Server-render one component to HTML, for a page body.
 *
 * `component` is either a path to a `.vue` file from the project root
 * ("/src/views/TermsView.vue"), loaded through Vite's own SSR module loader
 * so its template is compiled for the server against the same copy of Vue as
 * the renderer, or a component object that is already server-safe (a render
 * function). A path is the reliable choice for single-file components: under
 * vite-node an imported `.vue` file is compiled for the browser and calls
 * Vite's pre-bundled Vue, a second runtime the server renderer cannot drive.
 *
 * RouterLink becomes a plain link, useRouter()/useRoute() get an inert router
 * for the given path, and every custom directive (v-reveal and the like) is a
 * no-op, so the markup is what the page shows before its effects run.
 */
export async function renderStatic(component: unknown, props: Record<string, unknown> = {}, path = '/', root = process.cwd()): Promise<string> {
  const restore = shimBrowserGlobals(path)
  try {
    return await renderWith(component, props, path, root)
  } finally {
    restore()
  }
}

/**
 * A minimal stand-in for `window`, `location` and `history`, present only
 * while a body component loads and renders. Single-page apps often import
 * their router instance somewhere in a component's import chain, and
 * createWebHistory() reads window.location and adds window and document
 * listeners the moment that module loads, and theme or layout code often sets
 * a style on the root element. `document` offers inert root and body
 * elements, listener methods and queries that find nothing; it cannot create
 * elements, so code that builds real DOM still fails and is reported instead
 * of rendered wrong.
 */
function shimBrowserGlobals(path: string): () => void {
  const g = globalThis as Record<string, unknown>
  if (typeof g.window !== 'undefined') return () => {}
  const noop = () => {}
  const location = { pathname: path, search: '', hash: '', host: 'localhost', hostname: 'localhost', origin: 'http://localhost', protocol: 'http:', href: `http://localhost${path}` }
  const history = { state: null, length: 1, scrollRestoration: 'auto', pushState: noop, replaceState: noop, back: noop, forward: noop, go: noop }
  const media = () => ({ matches: false, media: '', addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop })
  const win = { location, history, addEventListener: noop, removeEventListener: noop, matchMedia: media, scrollTo: noop, innerWidth: 1280, innerHeight: 900, requestAnimationFrame: () => 0, cancelAnimationFrame: noop }
  // inert root and body: setting a style or class at load is harmless; queries find nothing
  const element = () => ({
    style: { setProperty: noop, removeProperty: noop, getPropertyValue: () => '' },
    classList: { add: noop, remove: noop, toggle: () => false, contains: () => false },
    dataset: {},
    setAttribute: noop,
    removeAttribute: noop,
    getAttribute: () => null,
    addEventListener: noop,
    removeEventListener: noop,
  })
  const doc = {
    addEventListener: noop,
    removeEventListener: noop,
    visibilityState: 'visible',
    hidden: false,
    cookie: '',
    documentElement: element(),
    body: element(),
    head: element(),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
  }
  // empty storage is a signed-out first visit, which is exactly what a crawler is
  const storage = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, String(v)), removeItem: (k: string) => void m.delete(k), clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size } }
  }
  const extras: Record<string, unknown> = { location, history, document: doc, localStorage: storage(), sessionStorage: storage() }
  Object.assign(win, extras, { window: win })
  // only names Node does not already define are added, and only those are removed
  const added = Object.keys(extras).filter((k) => {
    try {
      return typeof g[k] === 'undefined'
    } catch {
      return false
    }
  })
  g.window = win
  for (const k of added) g[k] = extras[k]
  return () => {
    delete g.window
    for (const k of added) delete g[k]
  }
}

async function renderWith(component: unknown, props: Record<string, unknown>, path: string, root: string): Promise<string> {
  const { createSSRApp, h, ref, defineComponent } = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  const { routerKey, routeLocationKey } = await import('vue-router')
  let comp = component
  if (typeof component === 'string') {
    const server = await staticLoader(root)
    const mod = (await server.ssrLoadModule(component)) as { default?: unknown }
    if (!mod.default) throw new Error(`${component} has no default export`)
    comp = mod.default
  }
  const route = { path, fullPath: path, name: undefined, params: {}, query: {}, hash: '', matched: [], meta: {} }
  const noop = () => Promise.resolve()
  const router = {
    currentRoute: ref(route),
    push: noop,
    replace: noop,
    back: () => {},
    go: () => {},
    resolve: (to: unknown) => ({ href: typeof to === 'string' ? to : ((to as { path?: string })?.path ?? '#') }),
    beforeEach: () => () => {},
    afterEach: () => () => {},
    isReady: noop,
  }
  const app = createSSRApp({ render: () => h(comp as never, props) })
  app.provide(routerKey, router as never)
  app.provide(routeLocationKey, route as never)
  const link = defineComponent({
    props: { to: { type: [String, Object], required: true } },
    setup(p, { slots, attrs }) {
      return () => h('a', { ...attrs, href: typeof p.to === 'string' ? p.to : ((p.to as { path?: string }).path ?? '#') }, slots.default?.())
    },
  })
  app.component('RouterLink', link)
  app.component('router-link', link)
  // a fresh store, when the site uses Pinia: layouts often read one (a navbar's signed-in state)
  const PINIA = 'pinia'
  const pinia = (await import(/* @vite-ignore */ PINIA).catch(() => null)) as { createPinia?: () => unknown } | null
  if (pinia?.createPinia) app.use(pinia.createPinia() as never)
  // every directive resolves, to nothing: reveal and motion directives only animate in a browser
  const ctx = (app as unknown as { _context: { directives: Record<string, unknown> } })._context
  ctx.directives = new Proxy(ctx.directives, { get: (t, k) => (typeof k === 'string' ? (t[k] ?? {}) : undefined) })
  app.config.warnHandler = () => {}
  const html = await renderToString(app)
  return html.replace(/<!--\[-->|<!--\]-->|<!---->/g, '').replace(/\s{2,}/g, ' ').trim()
}

interface SsrServer {
  ssrLoadModule: (url: string) => Promise<Record<string, unknown>>
  close: () => Promise<void>
}
let loader: Promise<SsrServer> | null = null

/** One Vite server in middleware mode, with the project's own config, for SSR loading only. */
function staticLoader(root: string): Promise<SsrServer> {
  if (!loader) {
    // every site that runs a prerender has Vite; the module itself does not depend on it
    const VITE = 'vite'
    loader = (import(/* @vite-ignore */ VITE) as Promise<{ createServer: (c: object) => Promise<SsrServer> }>).then(({ createServer }) =>
      createServer({
        root,
        logLevel: 'error',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true, include: [] },
      }) as unknown as Promise<SsrServer>,
    )
  }
  return loader
}

/** Close the SSR loader if one was started; safe to call when none was. */
export async function closeStaticLoader(): Promise<void> {
  if (!loader) return
  const l = loader
  loader = null
  await (await l).close()
}

/** True on a hosted or CI build (Vercel, Netlify, GitHub Actions and most others set one of these). */
export function onBuildServer(): boolean {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  return Boolean(env.CI || env.VERCEL || env.NETLIFY || env.GITHUB_ACTIONS || env.RENDER)
}

/** The minimum readable page: heading, description, navigation. */
export function floorBody(site: SiteConfig, page: ResolvedPage, all: ResolvedPage[]): string {
  const h1 = page.path === '/' ? site.name : stripBrand(site, page.title)
  return `<main><h1>${esc(h1)}</h1><p>${esc(page.description)}</p>${navList(site, all)}</main>`
}

async function writeAll(dist: string, template: string, site: SiteConfig, pages: ResolvedPage[], layout: 'clean' | 'directory', bases?: Map<string, string>): Promise<string[]> {
  const written: string[] = []
  for (const p of pages) {
    const file = fileFor(dist, p.path, layout)
    await mkdir(path.dirname(file), { recursive: true })
    let html = injectHead(bases?.get(p.path) ?? template, headHtml(site, p), site.lang ?? 'en')
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
  const re = /<div\b|<\/div>/gi
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
