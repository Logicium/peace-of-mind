import './assets/Main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { vPlx, vGrow, vReveal } from './motion/motion'
import { initApotomeAnalytics } from './kit/analytics'
import { applyDeep, initApotomeEditor, loadPublishedContent } from './kit/editor'
import { content } from './data/site'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.directive('plx', vPlx)
app.directive('grow', vGrow)
app.directive('reveal', vReveal)

app.mount('#app')

/* ----------------------------------------------------------------------
 * Apotome Labs studio: analytics, published copy overlay, in-situ editor.
 *
 * Opt-in on environment. With either variable unset this block does nothing
 * at all, so the site builds and runs standalone exactly as before.
 *
 * No fallback to VITE_API_URL, deliberately: Peace of Mind has a service of
 * its own, and the day this app starts calling it, an inherited variable
 * would quietly point the editor and the beacon at a server that knows
 * nothing about either. The studio gets its own variable or nothing.
 *
 * The published overlay is merged onto the content tree before the editor
 * starts, so the editor edits what visitors actually see rather than the
 * defaults compiled into the bundle. Mounting happens first either way: a
 * slow or unreachable studio API must never delay the site rendering.
 * ---------------------------------------------------------------------- */
const apotomeApi = import.meta.env.VITE_APOTOME_API_URL as string | undefined
const apotomeKey = import.meta.env.VITE_APOTOME_SITE_KEY as string | undefined

if (apotomeApi && apotomeKey) {
  initApotomeAnalytics({ siteKey: apotomeKey, apiUrl: apotomeApi, router })

  void loadPublishedContent({ siteKey: apotomeKey, apiUrl: apotomeApi }).then((overlay) => {
    if (overlay) applyDeep(content, overlay)
    initApotomeEditor({ siteKey: apotomeKey, apiUrl: apotomeApi, config: content })
  })
}
