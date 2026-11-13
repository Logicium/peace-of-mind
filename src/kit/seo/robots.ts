/* vendored from apotome-seo 1.1.1; edit the source, then re-run vendor.mjs */
/**
 * robots.txt, from the site config.
 *
 * Answer crawlers are always allowed: blocking one removes the site from that
 * assistant's answers and gains nothing. Training-only crawlers follow the
 * site's recorded policy. User-initiated fetchers are not listed because the
 * vendors say they may ignore robots.txt anyway. Section 7.2 of the standard.
 */

import { DEFAULT_PRIVATE_PREFIXES, type SiteConfig } from './types'

export const ANSWER_CRAWLERS = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'Applebot', 'bingbot', 'Googlebot']

export const TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'Amazonbot',
  'Bytespider',
]

export function privatePrefixes(site: SiteConfig): string[] {
  return site.privatePrefixes ?? DEFAULT_PRIVATE_PREFIXES
}

export function buildRobots(site: SiteConfig): string {
  if (site.indexable === false) return 'User-agent: *\nDisallow: /\n'

  const disallow = [...privatePrefixes(site), ...(site.crawlers?.disallow ?? [])]
    .map((p) => (p.endsWith('/') ? p : p))
    .filter((p, i, a) => a.indexOf(p) === i)

  const lines = ['User-agent: *', 'Allow: /', ...disallow.map((p) => `Disallow: ${p}`), '']

  lines.push('# Answer engines: always welcome (section 7.2 of the Apotome Labs SEO standard)')
  for (const bot of ANSWER_CRAWLERS) lines.push(`User-agent: ${bot}`)
  lines.push('Allow: /', ...disallow.map((p) => `Disallow: ${p}`), '')

  const training = site.crawlers?.training ?? 'allow'
  lines.push(`# Training-only crawlers: ${training === 'allow' ? 'allowed' : 'blocked'} by the site owner`)
  for (const bot of TRAINING_CRAWLERS) lines.push(`User-agent: ${bot}`)
  lines.push(training === 'allow' ? 'Allow: /' : 'Disallow: /', ...(training === 'allow' ? disallow.map((p) => `Disallow: ${p}`) : []), '')

  lines.push(`Sitemap: ${site.siteUrl.replace(/\/+$/, '')}/sitemap.xml`)
  return `${lines.join('\n')}\n`
}
