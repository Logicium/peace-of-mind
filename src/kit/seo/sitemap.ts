/* vendored from apotome-seo 1.0.1; edit the source, then re-run vendor.mjs */
/**
 * sitemap.xml and llms.txt, from the resolved page list.
 *
 * lastmod only when a page knows it; never priority or changefreq (Google
 * ignores both). Noindex pages are never listed. Section 4.4 of the standard.
 */

import { escXml, stripBrand, stripHtml, truncate } from './text'
import type { ResolvedPage, SiteConfig } from './types'

export function sitemapPages(site: SiteConfig, pages: ResolvedPage[]): ResolvedPage[] {
  if (site.indexable === false) return []
  return pages.filter((p) => !p.noindex)
}

export function buildSitemap(site: SiteConfig, pages: ResolvedPage[]): string {
  const entries = sitemapPages(site, pages)
    .map((p) => {
      const parts = [`    <loc>${escXml(p.url)}</loc>`]
      if (p.lastmod) parts.push(`    <lastmod>${escXml(p.lastmod.slice(0, 10))}</lastmod>`)
      const img = p.sitemapImage ?? (p.type === 'article' || p.type === 'product' ? p.image : undefined)
      if (img) {
        parts.push('    <image:image>', `      <image:loc>${escXml(img.url)}</image:loc>`)
        if (img.alt) parts.push(`      <image:caption>${escXml(img.alt)}</image:caption>`)
        parts.push('    </image:image>')
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

/** llms.txt per llmstxt.org: H1, blockquote summary, H2 sections of links. */
export function buildLlmsTxt(site: SiteConfig, pages: ResolvedPage[]): string {
  const listed = sitemapPages(site, pages)
  const home = listed.find((p) => p.path === '/')
  const top = listed.filter((p) => p.path !== '/' && p.path.split('/').length === 2)
  const deep = listed.filter((p) => p.path.split('/').length > 2)
  const line = (p: ResolvedPage) => `- [${stripBrand(site, p.title)}](${p.url}): ${truncate(p.description, 200)}`
  const out = [`# ${site.name}`, '', `> ${truncate(site.llmsSummary ?? site.description, 400)}`, '']
  if (site.entity.address) {
    const a = site.entity.address
    out.push(`${site.entity.name} is in ${a.addressLocality}, ${a.addressRegion}${site.entity.telephone ? `. Phone ${site.entity.telephone}` : ''}${site.entity.email ? `. Email ${site.entity.email}` : ''}.`, '')
  }
  out.push('## Pages', '')
  if (home) out.push(line(home))
  for (const p of top) out.push(line(p))
  if (deep.length) {
    out.push('', '## More', '')
    for (const p of deep.slice(0, 200)) out.push(line(p))
  }
  out.push('', '## Optional', '', `- [Sitemap](${site.siteUrl}/sitemap.xml)`, '')
  return out.join('\n')
}

/** The whole site as text, for sites with a journal or documentation. */
export function buildLlmsFullTxt(site: SiteConfig, pages: ResolvedPage[]): string {
  const listed = sitemapPages(site, pages).filter((p) => p.body)
  return (
    `# ${site.name}\n\n> ${truncate(site.llmsSummary ?? site.description, 400)}\n\n` +
    listed.map((p) => `## ${p.title}\n${p.url}\n\n${stripHtml(p.body ?? '')}`).join('\n\n---\n\n') +
    '\n'
  )
}
