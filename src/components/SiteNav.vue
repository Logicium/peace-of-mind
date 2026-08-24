<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import data from '@/data/data'

const copy = data.copy

/* only needed once the menu opens; keep it out of the initial bundle */
const LotusArt = defineAsyncComponent(() => import('@/assets/line-art/LotusArt.vue'))

const scrolled = ref(false)
const open = ref(false)
const route = useRoute()

const onScroll = () => {
  scrolled.value = window.scrollY > 24
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
  onScroll()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
})

watch(open, (v) => {
  document.documentElement.style.overflow = v ? 'hidden' : ''
})
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)

/* labels come from the tree so the nav and the footer can never disagree */
const links = [
  { to: '/', key: 'home' as const },
  { to: '/about', key: 'about' as const },
  { to: '/offer', key: 'offer' as const },
]
</script>

<template>
  <header class="nav" :class="{ 'nav--scrolled': scrolled, 'nav--open': open }">
    <div class="nav__inner wrap">
      <RouterLink to="/" class="nav__brand">
        <img class="nav__logo" src="/images/logo.png" alt="" />
        <span class="nav__wordmark">
          <span>{{ copy.brand.wordA }}</span> <em>{{ copy.brand.wordOf }}</em> <span>{{ copy.brand.wordB }}</span>
        </span>
        <span class="nav__suffix">{{ copy.brand.suffix }}</span>
      </RouterLink>

      <nav class="nav__links" aria-label="Primary">
        <RouterLink v-for="l in links.slice(1)" :key="l.to" :to="l.to" class="nav__link">
          {{ copy.nav[l.key] }}
        </RouterLink>
        <RouterLink to="/contact" class="pill pill--iris nav__cta">{{ copy.nav.cta }}</RouterLink>
      </nav>

      <button
        class="nav__burger"
        :aria-expanded="open"
        aria-label="Menu"
        @click="open = !open"
      >
        <span /><span />
      </button>
    </div>

    <Transition name="veil">
      <div v-if="open" class="veil">
        <div class="veil__flora" aria-hidden="true"><LotusArt /></div>
        <nav class="veil__links" aria-label="Menu">
          <RouterLink
            v-for="(l, i) in links"
            :key="l.to"
            :to="l.to"
            class="veil__link display"
            :style="{ transitionDelay: `${0.08 + i * 0.07}s` }"
          >
            {{ copy.nav[l.key] }}
          </RouterLink>
          <RouterLink
            to="/contact"
            class="veil__link display"
            :style="{ transitionDelay: `${0.08 + links.length * 0.07}s` }"
          >
            {{ copy.nav.contact }}
          </RouterLink>
        </nav>
        <p class="veil__tag">{{ copy.nav.tagline }}</p>
      </div>
    </Transition>
  </header>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.nav {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  transition: background-color 0.6s var(--ease), box-shadow 0.6s var(--ease);

  &--scrolled:not(.nav--open) {
    background: rgba(251, 247, 240, 0.82);
    backdrop-filter: blur(14px) saturate(1.4);
    box-shadow: 0 1px 0 $hairline;
  }
}

.nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4.75rem;
}

.nav__brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  line-height: 1;
}

.nav__logo {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  flex: none;
}

.nav__suffix,
.nav__wordmark { align-self: center; }

.nav__wordmark {
  font-family: $font-display;
  font-size: 1.45rem;
  font-weight: 460;
  letter-spacing: -0.02em;

  em { font-style: italic; font-weight: 350; color: $rose; }
}

.nav__suffix {
  font-size: $tiny;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: $ink-soft;

  @media (max-width: 700px) { display: none; }
}

.nav__links {
  display: flex;
  align-items: center;
  gap: clamp(1.2rem, 2.5vw, 2.4rem);

  @media (max-width: 860px) { display: none; }
}

.nav__link {
  position: relative;
  font-size: 0.95rem;
  font-weight: 400;
  padding-bottom: 3px;

  &::after {
    content: '';
    position: absolute;
    left: 0; right: 100%; bottom: 0;
    height: 1.5px;
    background: $rose;
    transition: right 0.5s var(--ease);
  }

  &:hover::after,
  &.router-link-active::after { right: 0; }
}

.nav__cta { height: 2.7rem; padding: 0 1.4rem; font-size: 0.88rem; }

.nav__burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 1.5px solid $ink;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.4s var(--ease);

  span {
    display: block;
    width: 1.15rem;
    height: 1.5px;
    margin-inline: auto;
    background: $ink;
    transition: transform 0.45s var(--ease), background-color 0.4s;
  }

  @media (max-width: 860px) { display: flex; }
}

.nav--open .nav__burger {
  border-color: rgba(255, 253, 248, 0.5);
  span { background: $cream; }
  span:first-child { transform: translateY(4.25px) rotate(45deg); }
  span:last-child { transform: translateY(-4.25px) rotate(-45deg); }
}

.nav--open .nav__wordmark,
.nav--open .nav__wordmark em { color: $cream; }

// ── full-screen menu ───────────────────────────────────────────────────
.veil {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: $ink;
  color: $cream;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: $gutter;
  overflow: hidden;
}

.veil__flora {
  position: absolute;
  right: -18%;
  bottom: -14%;
  width: 70vmin;
  color: $iris;
  opacity: 0.5;
  transform: rotate(12deg);

  :deep(svg) { width: 100%; height: 100%; }
}

.veil__links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.veil__link {
  font-size: clamp(2.6rem, 10vw, 4.5rem);
  line-height: 1.12;
  opacity: 1;
  transform: none;
  transition: opacity 0.8s var(--ease), transform 0.8s var(--ease), color 0.4s;

  &:hover { color: $rose; }
}

.veil-enter-from .veil__link { opacity: 0; transform: translateY(30px); }

.veil__tag {
  position: absolute;
  bottom: calc($gutter + 0.5rem);
  left: $gutter;
  font-size: $small;
  color: rgba(255, 253, 248, 0.65);
  max-width: 70%;
}

.veil-enter-active,
.veil-leave-active { transition: clip-path 0.8s var(--ease); }
.veil-enter-from,
.veil-leave-to { clip-path: circle(0% at calc(100% - 3.5rem) 2.4rem); }
.veil-enter-to,
.veil-leave-from { clip-path: circle(150% at calc(100% - 3.5rem) 2.4rem); }
</style>
