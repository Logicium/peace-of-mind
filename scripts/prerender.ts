/**
 * Post-build: one HTML file per public route, sitemap.xml, robots.txt,
 * llms.txt and 404.html, from the route table and site config.
 *
 *   npm run build        runs this through the postbuild hook
 *   npx vite-node scripts/prerender.ts
 *
 * The repo's seo.site.ts is the base; the Search settings the client
 * published in their studio portal lay over it (words, business record,
 * per-page titles). Every page's body is built from data.ts and
 * serviceDetails.ts. The Apotome Labs SEO + AEO Standard, section 13.
 */
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { applyPortalPages, fetchPortalSeo, mergePortalSeo, prerender } from '../src/kit/seo/node'
import { publicRoutes } from '../src/routes'
import { site } from '../src/seo.site'

const root = fileURLToPath(new URL('..', import.meta.url))
// .env.production (and Vercel's variables) decide which API the build reads from
const env = { ...loadEnv('production', root, 'VITE_'), ...process.env }

const settings = await fetchPortalSeo(env.VITE_APOTOME_API_URL ?? env.VITE_API_URL, env.VITE_APOTOME_SITE_KEY ?? env.VITE_ANALYTICS_SITE_KEY).catch(() => null)
console.log(settings ? `[seo] portal Search settings found (${settings.pages.length} page overrides)` : '[seo] no portal Search settings published; using the repo config')

await prerender({
  apiUrl: env.VITE_API_URL,
  site: mergePortalSeo(site, settings),
  routes: applyPortalPages(publicRoutes, settings),
  root: new URL('..', import.meta.url),
})
