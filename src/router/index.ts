import { createRouter, createWebHistory } from 'vue-router'
// Public pages and their SEO records live in src/routes.ts; the head is
// applied per route by installSeo in main.ts.
import { notFoundRoute, publicRoutes } from '@/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) {
      // wait out the page transition so the anchor exists before we scroll
      return new Promise((resolve) => {
        setTimeout(() => resolve({ el: to.hash, top: 88, behavior: 'smooth' }), 620);
      });
    }
    return { top: 0 };
  },
  routes: [...publicRoutes, notFoundRoute],
})

export default router
