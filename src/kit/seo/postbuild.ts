/**
 * The postbuild script, ready to run as it stands.
 *
 * Copy this alongside the rest of the kit and add to the site's package.json:
 *
 *   "postbuild": "vite-node src/kit/seo/postbuild.ts"
 *
 * It reads the site key and API URL from the environment the same way every
 * other kit module does, fetches whatever the client last published, and
 * stamps it into dist. With either variable missing, or nothing published, it
 * says so and exits zero: a site should always be able to build.
 */

import path from 'node:path'
import { fetchPublishedSeo, seoSourceFromEnv } from './fetchSeo'
import { stampSeo } from './stamp'

async function main() {
  const source = seoSourceFromEnv()
  if (!source) {
    console.log('[seo] no site key or API url set, leaving the build alone')
    return
  }

  const settings = await fetchPublishedSeo(source)
  if (!settings) {
    console.log(`[seo] nothing published for ${source.siteKey}, leaving the build alone`)
    return
  }

  const distDir = path.resolve(process.cwd(), process.env.SEO_DIST_DIR || 'dist')
  const result = await stampSeo({ distDir, settings })
  console.log(
    `[seo] stamped ${result.pages.length} page${result.pages.length === 1 ? '' : 's'} ` +
      `(${result.pages.join(', ')}), sitemap.xml and robots.txt`,
  )
}

main().catch((err: unknown) => {
  // a build that fails over search settings is worse than a build with stale
  // ones: the client's site stops shipping over a field they cannot see
  console.warn('[seo] skipped:', err instanceof Error ? err.message : err)
})
