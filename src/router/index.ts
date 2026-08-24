import { createRouter, createWebHistory } from 'vue-router'
import HomePage from "@/pages/HomePage.vue";

const AboutPage = () => import("@/pages/AboutPage.vue");
const ContactPage = () => import("@/pages/ContactPage.vue");
const OfferPage = () => import("@/pages/OfferPage.vue");


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
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutPage,
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactPage,
    },
    {
      path: '/offer',
      name: 'offer',
      component: OfferPage,
    },
  ],
})

export default router
