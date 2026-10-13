/**
 * The build step, as a Vite plugin.
 *
 * This is the way in for most sites. The alternative, `postbuild.ts` run
 * through vite-node, needs vite-node installed; a plugin needs nothing at all,
 * because Vite already compiles its own config file and already knows when the
 * bundle is finished. Two lines in `vite.config.ts` and the site is done:
 *
 *   import { apotomeSeo } from './src/kit/seo/plugin'
 *   plugins: [vue(), apotomeSeo()]
 *
 * It runs on `vite build` only. `vite dev` serves from memory and has no dist
 * to stamp, and a dev server that paused to call the studio on every restart
 * would be a tax on every save.
 *
 * Nothing here can fail a build. A studio outage, an unprovisioned site key,
 * settings nobody has published yet: each prints one line and leaves the
 * output exactly as Vite made it.
 */

import { fetchPublishedSeo, seoSourceFromEnv } from './fetchSeo'
import { stampSeo } from './stamp'
import type { SeoSettings } from './types'

export interface ApotomeSeoOptions {
  /** where the build wrote to, when it is not `dist` */
  outDir?: string
  /**
   * Settings to stamp instead of fetching them.
   *
   * For a site that would rather keep its search settings in the repo than in
   * the portal, and for testing this without a network.
   */
  settings?: SeoSettings | null
  /** say nothing on success */
  quiet?: boolean
}

interface VitePluginShape {
  name: string
  apply: 'build'
  closeBundle: () => Promise<void>
}

export function apotomeSeo(options: ApotomeSeoOptions = {}): VitePluginShape {
  let outDir = options.outDir ?? 'dist'

  return {
    name: 'apotome-seo',
    apply: 'build',

    /*
     * Vite hands the resolved config to this hook, which is how the plugin
     * learns an outDir the site configured rather than assuming ours. Typed
     * loosely on purpose: the kit is vendored into repos on their own Vite
     * versions, and importing Vite's types here would tie it to one of them.
     */
    configResolved(config: { build?: { outDir?: string } }) {
      if (!options.outDir && config.build?.outDir) outDir = config.build.outDir
    },

    async closeBundle() {
      try {
        const settings =
          options.settings !== undefined
            ? options.settings
            : await fetchPublishedSeo(seoSourceFromEnv())

        if (!settings) {
          console.log('[seo] nothing published for this site, leaving the build alone')
          return
        }

        const result = await stampSeo({ distDir: outDir, settings })
        if (!options.quiet) {
          console.log(
            `[seo] stamped ${result.pages.length} page${result.pages.length === 1 ? '' : 's'}, ` +
              'sitemap.xml and robots.txt',
          )
        }
      } catch (err) {
        // a build that fails over search settings is worse than a build with
        // stale ones: the site stops shipping over a field nobody can see
        console.warn('[seo] skipped:', err instanceof Error ? err.message : err)
      }
    },
  } as VitePluginShape & { configResolved: (config: { build?: { outDir?: string } }) => void }
}
