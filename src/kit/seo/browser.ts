/* vendored from apotome-seo 1.4.2; edit the source, then re-run vendor.mjs */
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/**
 * Body snapshots through a headless browser.
 *
 * For sites whose pages cannot be rendered under Node (three.js, CSS3D, DOM
 * access in setup), the real app is loaded from the built `dist` and the
 * rendered `#app` is captured. Scripts, canvases and inline styles are
 * stripped from the snapshot; the app replaces it on hydration anyway.
 *
 * Node only. Loads puppeteer, or puppeteer-core with @sparticuz/chromium, if
 * the site has either installed; returns null when it has neither.
 */

import { createServer, type Server } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type { AddressInfo } from 'node:net'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.glb': 'model/gltf-binary',
  '.hdr': 'application/octet-stream',
}

/** A static server over dist with the SPA fallback, so the app boots for any route. */
async function serveDist(dist: string): Promise<{ server: Server; origin: string }> {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]!)
    const candidates = [url, `${url}.html`, `${url}/index.html`].map((p) => path.join(dist, p))
    for (const file of candidates) {
      try {
        const s = await stat(file)
        if (s.isFile()) {
          res.setHeader('Content-Type', MIME[path.extname(file)] ?? 'application/octet-stream')
          res.end(await readFile(file))
          return
        }
      } catch {
        /* next */
      }
    }
    if (path.extname(url)) {
      res.statusCode = 404
      res.end('not found')
      return
    }
    res.setHeader('Content-Type', MIME['.html']!)
    res.end(await readFile(path.join(dist, 'index.html')))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return { server, origin: `http://127.0.0.1:${port}` }
}

type Launcher = { launch: (opts: Record<string, unknown>) => Promise<{ newPage: () => Promise<Page>; close: () => Promise<void> }> }
interface Page {
  setViewport: (v: { width: number; height: number }) => Promise<void>
  goto: (url: string, o: Record<string, unknown>) => Promise<unknown>
  evaluate: <T, A>(fn: (arg: A) => T, arg: A) => Promise<T>
  close: () => Promise<void>
}

async function launcher(): Promise<{ browser: Launcher; args: Record<string, unknown> } | null> {
  // dynamic specifiers so a bundler never tries to resolve what is not installed
  const load = (name: string) => import(/* @vite-ignore */ name).catch(() => null)
  const full = (await load('puppeteer')) as { default?: Launcher } | null
  if (full?.default) return { browser: full.default, args: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader'] } }
  const core = (await load('puppeteer-core')) as { default?: Launcher } | null
  const chromium = (await load('@sparticuz/chromium')) as { default?: { args: string[]; executablePath: () => Promise<string> } } | null
  if (core?.default && chromium?.default) {
    return { browser: core.default, args: { headless: true, args: chromium.default.args, executablePath: await chromium.default.executablePath() } }
  }
  return null
}

export interface SnapshotOptions {
  /** ms to wait after network idle for animations and lazy content */
  settle?: number
  width?: number
  height?: number
  /** selectors removed from the snapshot besides script, canvas and style */
  strip?: string[]
  log?: (line: string) => void
  /**
   * The whole browser step's budget in ms (default 5 minutes). Pages not
   * reached in time get floor bodies. A hosted build has a hard wall-clock
   * limit (Vercel's is 45 minutes) and a stuck headless browser would
   * otherwise spend all of it and ship nothing.
   */
  budget?: number
}

/** Resolves with the promise, or with `fallback` once `ms` have passed; never rejects. */
function within<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      () => {
        clearTimeout(t)
        resolve(fallback)
      },
    )
  })
}

/**
 * Snapshot `#app` for each path. Returns null when no browser is available so
 * the caller can fall back; throws only when the browser is there and fails.
 *
 * Every step is bounded. Build machines are where headless Chrome misbehaves
 * (no GPU, a tiny /dev/shm, missing libraries): it may never launch, stall
 * mid-page, or ignore close(). So launch has a timeout, each page has one and
 * a failed page is skipped rather than ending the run, the run has a budget,
 * and teardown kills the browser process if it will not close, so nothing
 * here can keep the build process alive.
 */
export async function snapshotBodies(dist: string, paths: string[], opts: SnapshotOptions = {}): Promise<Map<string, string> | null> {
  const found = await launcher()
  if (!found) return null
  const { server, origin } = await serveDist(dist)
  const out = new Map<string, string>()
  const started = Date.now()
  const budget = opts.budget ?? 5 * 60_000
  let browser: Awaited<ReturnType<Launcher['launch']>> | null = null
  try {
    browser = await found.browser.launch({ ...found.args, timeout: 60_000, protocolTimeout: 90_000 })
    const page = await browser.newPage()
    await page.setViewport({ width: opts.width ?? 1280, height: opts.height ?? 900 })
    let failures = 0
    for (const p of paths) {
      if (Date.now() - started > budget) {
        opts.log?.(`[seo] browser budget of ${Math.round(budget / 1000)}s spent; ${paths.length - out.size} page(s) left for floor bodies`)
        break
      }
      try {
        await page.goto(`${origin}${p}`, { waitUntil: 'networkidle0', timeout: 30_000 })
      } catch (err) {
        // a page that never goes network-idle is still worth capturing if it rendered
        opts.log?.(`[seo] ${p}: ${err instanceof Error ? err.message.split('\n')[0] : err}`)
        if (++failures >= 3) {
          opts.log?.('[seo] three pages failed to load; stopping the browser and using floor bodies for the rest')
          break
        }
      }
      if (opts.settle) await new Promise((r) => setTimeout(r, opts.settle))
      const strip = ['script', 'canvas', 'style', 'noscript', ...(opts.strip ?? [])]
      const html = await page
        .evaluate((selectors: string[]) => {
          const root = document.querySelector('#app')
          if (!root) return ''
          const clone = root.cloneNode(true) as HTMLElement
          for (const sel of selectors) for (const el of Array.from(clone.querySelectorAll(sel))) el.remove()
          // hidden-until-reveal elements must read as visible in the static file
          for (const el of Array.from(clone.querySelectorAll<HTMLElement>('[style]'))) {
            const st = el.getAttribute('style') || ''
            if (/opacity\s*:\s*0|visibility\s*:\s*hidden|transform/.test(st)) el.removeAttribute('style')
          }
          for (const el of Array.from(clone.querySelectorAll('[aria-hidden="true"]'))) {
            if ((el.textContent || '').trim()) el.removeAttribute('aria-hidden')
          }
          // transition-time attributes that must not freeze into the static file
          for (const el of Array.from(clone.querySelectorAll('[inert]'))) el.removeAttribute('inert')
          return clone.innerHTML
        }, strip)
        .catch(() => '')
      out.set(p, html.replace(/\s{2,}/g, ' ').trim())
      opts.log?.(`[seo] snapshot ${p} (${out.get(p)!.length} chars)`)
    }
    await within(page.close(), 10_000, undefined)
  } finally {
    if (browser) {
      const closed = await within(browser.close().then(() => true), 15_000, false)
      if (!closed) {
        opts.log?.('[seo] the browser would not close; killing it')
        ;(browser as unknown as { process?: () => { kill: (s: string) => void } | null }).process?.()?.kill('SIGKILL')
      }
    }
    // keep-alive sockets from the browser would hold the build process open
    ;(server as Server & { closeAllConnections?: () => void }).closeAllConnections?.()
    server.close()
  }
  return out
}
