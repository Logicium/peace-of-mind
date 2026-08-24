<script setup lang="ts">
import { computed } from 'vue'
import data from '@/data/data'

const copy = data.copy
import serviceDetails from '@/data/serviceDetails'
import FloraField from '@/components/FloraField.vue'
import type { FloraItem } from '@/components/FloraField.vue'

const chips = computed(() =>
  data.about.subtitle.split('|').map((s) => s.trim()).filter(Boolean),
)

/* one chapter per service, styled by its own accent family */
const chapters = computed(() => {
  const d = serviceDetails
  return [
    {
      id: 'childbirth',
      detail: d.childbirth,
      image: '/images/insta/IMG_0185.heic',
      alt: 'Childbirth education session',
      accent: 'var(--iris)',
      tint: 'var(--lilac)',
      art: 'rose' as const,
    },
    {
      id: 'doula',
      detail: d.doula,
      image: '/images/insta/IMG_0379.heic',
      alt: 'Doula supporting a birthing parent',
      accent: 'var(--rose)',
      tint: 'var(--blush)',
      art: 'lily' as const,
    },
    {
      id: 'birth-plan',
      detail: d.birthPlan,
      image: '/images/insta/IMG_0473.heic',
      alt: 'Birth plan conversation',
      accent: 'var(--meadow)',
      tint: 'var(--mint)',
      art: 'carnation' as const,
    },
    {
      id: 'car-seat',
      detail: d.carSeat,
      image: '/images/carseat/seat3.JPEG',
      alt: 'Certified car seat safety check',
      accent: 'var(--amber)',
      tint: 'var(--butter)',
      art: 'lotus' as const,
    },
  ]
})

const taglines = (t: string | string[] | undefined) =>
  !t ? [] : Array.isArray(t) ? t : [t]

/* each chapter gets one huge signature bloom bleeding off the band's corner,
   plus a small counterweight sprig low on the other side */
const chapterFlora = (art: FloraItem['art'], accent: string): FloraItem[] => [
  {
    art,
    at: { top: '-14%', right: '-16%' },
    size: 'clamp(360px, 48vw, 860px)',
    tint: accent,
    opacity: 0.2,
    speed: 0.06,
    rotate: 4,
    baseRotate: 14,
    mouse: 0.012,
  },
  {
    art: 'stem3',
    at: { bottom: '-6%', left: '-4%' },
    size: 'clamp(150px, 17vw, 300px)',
    tint: accent,
    opacity: 0.24,
    speed: 0.12,
    rotate: -6,
    baseRotate: -18,
  },
]
</script>

<template>
  <main class="offer">
    <!-- ── header ───────────────────────────────────────────────────── -->
    <section class="head wrap">
      <h1 class="display head__title">
        <span v-reveal:up="0.05">{{ copy.offer.headA }}</span>
        <span class="head__accent" v-reveal:up="0.16"><em>{{ copy.offer.headEm }}</em></span>
      </h1>
      <div class="head__chips" v-reveal:up="0.3">
        <span v-for="(chip, i) in chips" :key="i" class="head__chip">
          <span class="dot" :style="{ '--accent': ['var(--iris)', 'var(--rose)', 'var(--meadow)'][i % 3] }" />
          {{ chip }}
        </span>
      </div>
    </section>

    <!-- ── chapters ─────────────────────────────────────────────────── -->
    <section
      v-for="(ch, i) in chapters"
      :id="ch.id"
      :key="ch.id"
      class="chapter"
      :style="{ '--accent': ch.accent, '--tint': ch.tint }"
    >
      <div class="chapter__band">
        <FloraField :items="chapterFlora(ch.art, ch.accent)" />
        <div class="wrap chapter__grid">
          <div class="chapter__side">
            <div class="chapter__sideInner">
              <p class="chapter__num fr" v-reveal>{{ String(i + 1).padStart(2, '0') }}</p>
              <h2 class="display d-lg chapter__title" v-reveal:up="0.08">{{ ch.detail.title }}</h2>
              <div class="chapter__price" v-reveal:up="0.16" v-html="ch.detail.price" />
              <RouterLink to="/contact" class="pill chapter__book" v-reveal:up="0.22">
                {{ copy.offer.book }}
              </RouterLink>
            </div>
          </div>

          <div class="chapter__main">
            <div class="chapter__photo mask-arch" v-grow v-reveal:mask>
              <img :src="ch.image" :alt="ch.alt" loading="lazy" />
            </div>

            <p
              v-for="(t, j) in taglines('tagline' in ch.detail ? ch.detail.tagline : undefined)"
              :key="j"
              class="display d-md chapter__tagline"
              v-reveal:up="0.05 + j * 0.06"
            >
              <em>{{ t }}</em>
            </p>

            <p v-if="'fullDesc' in ch.detail && ch.detail.fullDesc" class="lead chapter__desc" v-reveal>
              {{ ch.detail.fullDesc }}
            </p>

            <ul class="chapter__list">
              <li v-for="(inc, j) in ch.detail.includes" :key="j" v-reveal:up="j * 0.05">
                <span class="dot" />{{ inc }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ── sliding scale ────────────────────────────────────────────── -->
    <section class="scale">
      <div class="wrap">
        <div class="scale__panel mesh" v-reveal:scale>
          <p class="display d-md scale__text"><em>{{ serviceDetails.slidingScale }}</em></p>
          <RouterLink to="/contact" class="pill pill--iris scale__btn">{{ copy.nav.cta }}</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

// ── header ─────────────────────────────────────────────────────────────
.head {
  padding-top: calc(4.75rem + clamp(2.5rem, 7vw, 6rem));
  padding-bottom: clamp(2.5rem, 6vw, 5rem);
}

.head__title {
  font-size: clamp(3.6rem, 10vw, 9rem);
  line-height: 0.98;

  span { display: block; }
}

.head__accent {
  padding-left: clamp(1.5rem, 6vw, 6rem);
  color: $iris;
}

.head__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: clamp(1.8rem, 3.5vw, 2.8rem);
}

.head__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1.25rem;
  border: 1px solid $hairline;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 400;
  background: $cream;
}

// ── chapters ───────────────────────────────────────────────────────────
.chapter {
  padding-block: clamp(0.6rem, 1.5vw, 1.2rem);
  scroll-margin-top: 5.5rem;
}

.chapter__band {
  position: relative;
  background: var(--tint);
  border-radius: clamp(36px, 6vw, 72px);
  margin-inline: clamp(0.6rem, 1.5vw, 1.4rem);
  overflow: clip;
  padding-block: clamp(3.5rem, 7vw, 6.5rem);
}

.chapter__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  gap: clamp(2.5rem, 6vw, 7rem);
  align-items: start;

  @media (max-width: 860px) { grid-template-columns: 1fr; }
}

.chapter__sideInner {
  position: sticky;
  top: 6.5rem;

  @media (max-width: 860px) { position: static; }
}

.chapter__num {
  font-style: italic;
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  color: var(--accent);
}

.chapter__title { margin-top: 0.8rem; }

.chapter__price {
  margin-top: clamp(1.6rem, 3vw, 2.4rem);
  padding: 1.3rem 1.6rem;
  background: rgba(255, 253, 248, 0.72);
  border-radius: 24px;
  max-width: 26rem;
  line-height: 1.5;
  font-weight: 300;

  :deep(u) {
    display: block;
    text-decoration: none;
    font-size: $tiny;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.35rem;

    b { font-weight: 600; }
  }
}

.chapter__book { margin-top: 1.6rem; }

.chapter__photo {
  aspect-ratio: 4 / 3.4;
  max-height: 460px;
  width: 100%;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.chapter__tagline {
  margin-top: clamp(1.8rem, 3.5vw, 2.6rem);
  max-width: 24em;
}

.chapter__desc {
  margin-top: 1.4rem;
  max-width: 58ch;
}

.chapter__list {
  list-style: none;
  margin: clamp(1.8rem, 3vw, 2.4rem) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;

  li {
    display: flex;
    align-items: baseline;
    gap: 0.9rem;
    padding-block: 0.95rem;
    border-bottom: 1px solid rgba(43, 31, 61, 0.1);
    font-weight: 300;
    line-height: 1.55;

    &:last-child { border-bottom: none; }
  }
}

// ── sliding scale ──────────────────────────────────────────────────────
.scale { padding-block: clamp(2rem, 5vw, 4rem) $section; }

// pearl mesh: light porcelain field with vivid blurred pops, ink text
.scale__panel {
  position: relative;
  background-color: #f7f1e8;
  color: $ink;
  --mesh:
    radial-gradient(44% 54% at 18% 22%, rgba(106, 74, 227, 0.4) 0%, rgba(106, 74, 227, 0) 70%),
    radial-gradient(46% 56% at 84% 18%, rgba(224, 64, 127, 0.42) 0%, rgba(224, 64, 127, 0) 70%),
    radial-gradient(50% 58% at 74% 94%, rgba(64, 205, 158, 0.35) 0%, rgba(64, 205, 158, 0) 72%),
    radial-gradient(36% 44% at 24% 90%, rgba(255, 190, 120, 0.55) 0%, rgba(255, 190, 120, 0) 72%),
    linear-gradient(135deg, #fbf7f0 0%, #f2e9db 100%);
  border-radius: clamp(36px, 6vw, 72px);
  padding: clamp(3.5rem, 8vw, 7rem) clamp(1.8rem, 6vw, 6rem);
  text-align: center;
}

.scale__text {
  max-width: 34em;
  margin-inline: auto;
  line-height: 1.45;
}

.scale__btn { margin-top: 2.4rem; }
</style>
