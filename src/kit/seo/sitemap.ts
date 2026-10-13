/**
 * The two files a crawler asks for before it asks for anything else.
 *
 * Both are derived from the same page list the head tags use, so a page that
 * says noindex cannot end up advertised in the sitemap: the one inconsistency
 * that makes an engine distrust the rest of the file.
 */

import { imageFor, titleFor, urlFor, type SeoSettings } from './types'

/** Pages that belong in a sitemap: indexed ones, on a site that is indexable. */
export function sitemapPages(settings: SeoSettings) {
  if (!settings.indexable || !settings.domain) return []
  return settings.pages.filter((p) => !p.noindex)
}

export function buildSitemap(settings: SeoSettings, lastmod?: string): string {
  const pages = sitemapPages(settings)
  const day = (lastmod ?? new Date().toISOString()).slice(0, 10)
  const entries = pages
    .map((page) => {
      const parts = [`    <loc>${escapeXml(urlFor(settings, page))}</loc>`, `    <lastmod>${day}</lastmod>`]
      if (page.changefreq) parts.push(`    <changefreq>${page.changefreq}</changefreq>`)
      // an explicit priority, or the home page's implicit claim to be first
      const priority = page.priority ?? (page.path === '/' ? 1 : undefined)
      if (priority !== undefined) parts.push(`    <priority>${priority.toFixed(1)}</priority>`)

      /*
       * The page's image, declared in the sitemap's image extension.
       *
       * Image search is a real door into a small business site, and it opens
       * on a caption: the page's own title says what the picture is of, which
       * a file called hero-2-final.jpg never will.
       */
      const image = imageFor(settings, page)
      if (image) {
        parts.push(
          '    <image:image>',
          `      <image:loc>${escapeXml(image)}</image:loc>`,
          `      <image:caption>${escapeXml(titleFor(settings, page))}</image:caption>`,
          '    </image:image>',
        )
      }
      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    `${entries}\n</urlset>\n`
  )
}

/**
 * robots.txt.
 *
 * A site that is not indexable gets a blanket disallow rather than a missing
 * file, because "no robots.txt" means "crawl everything" and the client asked
 * for the opposite. Individual noindex pages are left out of the disallow
 * list on purpose: a disallowed page cannot be crawled, so the noindex tag on
 * it is never read, and a page linked from elsewhere can be indexed anyway.
 * The meta tag is the instrument that works; robots.txt only says where the
 * sitemap is.
 */
export function buildRobots(settings: SeoSettings): string {
  if (!settings.indexable) {
    return 'User-agent: *\nDisallow: /\n'
  }
  /*
   * The wildcard rule is the one that governs. The named crawlers below it
   * are redundant to a strict reading of the standard and are here anyway,
   * because several of them read the block addressed to them and ignore the
   * wildcard entirely once they find one.
   */
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /api/']
  for (const bot of ['Googlebot', 'Googlebot-Image', 'Bingbot', 'DuckDuckBot']) {
    lines.push('', `User-agent: ${bot}`, 'Allow: /')
  }
  if (settings.domain) {
    lines.push('', `Host: ${settings.domain}`, `Sitemap: ${settings.domain}/sitemap.xml`)
  }
  return `${lines.join('\n')}\n`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
