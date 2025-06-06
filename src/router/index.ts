import { createRouter, createWebHistory } from 'vue-router'
import HomePage from "@/pages/HomePage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/pages/AboutPage.vue'),
    },
    {
      path: '/contact',
      name: 'contact',
      // route level code-splitting
      // which is lazy-loaded when the route is visited.
      component: () => import('@/pages/ContactPage.vue'),
    },
    {
      path: '/offer',
      name: 'offer',
      // route level code-splitting
      // which is lazy-loaded when the route is visited.
      component: () => import('@/pages/OfferPage.vue'),
    },
  ],
})

export default router
