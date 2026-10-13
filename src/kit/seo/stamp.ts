/**
 * The build step: take the settings the client published and write them into
 * the built site.
 *
 * A single page app serves one index.html for every route, so a crawler that
 * does not run JavaScript sees one title for the whole site. This walks the
 * page list and writes a real file per path, each with its own head, plus a
 * sitemap and a robots.txt. Vercel serves `/about/index.html` for `/about`
 * without any configuration, and the SPA takes over the moment it hydrates.
 *
 * Node only. It is imported by a postbuild script, never by the site bundle.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { headHtml } from './head'
import { buildRobots, buildSitemap } from './sitemap'
import type { SeoSettings } from './types'

export interface StampResult {
  pages: string[]
  sitemap: boolean
  robots: boolean
}

/** Where the head goes, and what it replaces if a build already wrote one. */
const MARKER_OPEN = '<!-- apotome:seo -->'
const MARKER_CLOSE = '<!-- /apotome:seo -->'

/**
 * Replace the parts of an existing head that we own.
 *
 * Vite's index.html already carries a title and often a description. Leaving
 * them in place means two titles in one document, and which one wins is up to
 * the parser. So the tags we manage are stripped first, then ours go in as
 * one marked block that a second run can find and replace whole.
 */
export function injectHead(html: string, headMarkup: string): string {
  let out = html

  // a previous stamp of ours, replaced wholesale
  const existing = new RegExp(`${MARKER_OPEN}[\\s\\S]*?${MARKER_CLOSE}`, 'g')
  out = out.replace(existing, '')

  // whatever the template shipped that we are about to say again
  out = out
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["'](description|robots|twitter:[^"']+)["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, '')

  const block = `${MARKER_OPEN}\n    ${headMarkup}\n    ${MARKER_CLOSE}`
  if (/<\/head>/i.test(out)) return out.replace(/<\/head>/i, `    ${block}\n  </head>`)
  // no head element at all: put it at the top rather than lose it
  return `${block}\n${out}`
}

/**
 * Write one HTML file per page, plus sitemap.xml and robots.txt.
 *
 * Failure to stamp is not failure to build. A studio outage, a site key that
 * has not been provisioned yet, an empty settings object: all of them should
 * leave the client with the site they had, not a red build. The caller gets
 * back what was written and can log it.
 */
export async function stampSeo(opts: {
  distDir: string
  settings: SeoSettings | null
  /** the built index.html, read from distDir when not supplied */
  template?: string
  lastmod?: string
}): Promise<StampResult> {
  const empty: StampResult = { pages: [], sitemap: false, robots: false }
  if (!opts.settings) return empty

  const settings = opts.settings
  const indexPath = path.join(opts.distDir, 'index.html')
  const template = opts.template ?? (await readFile(indexPath, 'utf8'))

  const written: string[] = []
  for (const page of settings.pages) {
    const html = injectHead(template, headHtml(settings, page))
    const target =
      page.path === '/'
        ? indexPath
        : path.join(opts.distDir, page.path.replace(/^\//, ''), 'index.html')
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, html, 'utf8')
    written.push(page.path)
  }

  await writeFile(path.join(opts.distDir, 'sitemap.xml'), buildSitemap(settings, opts.lastmod), 'utf8')
  await writeFile(path.join(opts.distDir, 'robots.txt'), buildRobots(settings), 'utf8')

  return { pages: written, sitemap: true, robots: true }
}
