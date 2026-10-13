import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { apotomeSeo } from './src/kit/seo/plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // stamps the published search settings into dist on `vite build`
    apotomeSeo(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
