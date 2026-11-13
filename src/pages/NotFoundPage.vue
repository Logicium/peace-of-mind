<script setup lang="ts">
/**
 * The 404. A real page with a real status in the prerendered 404.html, never
 * a redirect home: a broken link should show up in Search Console, and a
 * visitor should land somewhere useful.
 */
import data from '@/data/data'

const copy = data.copy
const links = [
  { to: '/', label: copy.nav.home },
  { to: '/about', label: copy.nav.about },
  { to: '/offer', label: copy.nav.offer },
  { to: '/contact', label: copy.nav.contact },
]
</script>

<template>
  <main class="not-found">
    <section class="wrap not-found__inner">
      <h1 class="display not-found__title">Not <em>here.</em></h1>
      <p class="lead not-found__lede">
        That page is not on peaceofmindbirthed.com. It may have moved, or the link may have a typo.
      </p>
      <nav aria-label="Main pages" class="not-found__links">
        <RouterLink v-for="l in links" :key="l.to" :to="l.to">{{ l.label }}</RouterLink>
      </nav>
      <RouterLink to="/" class="pill pill--iris">Back to the home page</RouterLink>
    </section>
  </main>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";

.not-found__inner {
  padding-top: calc(4.75rem + clamp(4rem, 10vw, 8rem));
  padding-bottom: clamp(4rem, 10vw, 8rem);
  display: grid;
  gap: 1.75rem;
  justify-items: start;
  max-width: 60ch;
}

.not-found__title {
  font-size: clamp(3.2rem, 8.5vw, 7rem);
  line-height: 1;

  em { color: $iris; }
}

.not-found__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;

  a {
    color: $ink;
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-color: $rose;
  }
}
</style>
