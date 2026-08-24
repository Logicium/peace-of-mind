<script setup lang="ts">
import { computed } from 'vue'
import data from '@/data/data'

const copy = data.copy
import FloraField from '@/components/FloraField.vue'
import type { FloraItem } from '@/components/FloraField.vue'
import MarqueeStrip from '@/components/MarqueeStrip.vue'
import ServiceIndex from '@/components/ServiceIndex.vue'
import ReviewsCarousel from '@/components/ReviewsCarousel.vue'
import GalleryDrift from '@/components/GalleryDrift.vue'
import WordReveal from '@/components/WordReveal.vue'
import CtaBand from '@/components/CtaBand.vue'

const marqueeItems = computed(() =>
  data.about.subtitle.split('|').map((s) => s.trim()).filter(Boolean),
)

/* research copy ships as "lead\n* bullet\n* bullet" strings */
const research = computed(() =>
  data.research.map((r) => {
    const lines = r.desc.split('\n').map((l) => l.trim()).filter(Boolean)
    return {
      ...r,
      lead: lines.filter((l) => !l.startsWith('*')).join(' '),
      bullets: lines.filter((l) => l.startsWith('*')).map((l) => l.replace(/^\*\s*/, '')),
    }
  }),
)

const heroFlora: FloraItem[] = [
  { art: 'rose', at: { top: '4%', right: '30%' }, size: 'clamp(280px, 34vw, 560px)', tint: 'var(--lilac)', opacity: 0.9, blur: 3, speed: 0.04, rotate: 4, baseRotate: 12, mouse: 0.015 },
  { art: 'lotus', at: { bottom: '16%', left: '-6%' }, size: 'clamp(200px, 24vw, 400px)', tint: 'var(--blush)', opacity: 0.95, blur: 1.5, speed: 0.09, rotate: -5, baseRotate: -8, mouse: 0.02 },
  { art: 'carnation', at: { top: '9%', right: '6%' }, size: 'clamp(120px, 13vw, 220px)', tint: 'var(--rose)', opacity: 0.85, speed: 0.16, rotate: 8, baseRotate: -16, mouse: 0.04, z: 2 },
  { art: 'sakura', at: { bottom: '24%', right: '4%' }, size: 'clamp(90px, 10vw, 170px)', tint: 'var(--iris)', opacity: 0.9, speed: 0.22, rotate: -10, baseRotate: 20, mouse: 0.05, z: 2 },
  { art: 'stem3', at: { top: '46%', left: '20%' }, size: 'clamp(70px, 8vw, 130px)', tint: 'var(--meadow)', opacity: 0.8, speed: 0.13, baseRotate: -24, mouse: 0.03 },
]

/* oversized blooms behind the service index: cropped by the viewport edge,
   drifting at different depths, visible through the transparent closed rows */
const servicesFlora: FloraItem[] = [
  { art: 'rose', at: { top: '-10%', right: '-16%' }, size: 'clamp(440px, 54vw, 940px)', tint: 'var(--lilac)', opacity: 0.85, speed: 0.05, rotate: 4, baseRotate: 18, mouse: 0.012 },
  { art: 'poppy', at: { bottom: '-12%', left: '-18%' }, size: 'clamp(320px, 40vw, 700px)', tint: 'var(--blush)', opacity: 0.9, speed: 0.1, rotate: -5, baseRotate: -10, mouse: 0.02 },
  { art: 'sakura', at: { top: '34%', left: '-7%' }, size: 'clamp(140px, 16vw, 280px)', tint: 'var(--mint)', opacity: 0.9, speed: 0.15, rotate: 7, baseRotate: 24 },
]

const evidenceFlora: FloraItem[] = [
  { art: 'lily', at: { top: '-6%', right: '-7%' }, size: 'clamp(240px, 28vw, 480px)', tint: 'var(--iris)', opacity: 0.34, speed: 0.07, rotate: 5, baseRotate: 20 },
  { art: 'poppy', at: { bottom: '-10%', left: '-5%' }, size: 'clamp(180px, 20vw, 340px)', tint: 'var(--rose)', opacity: 0.28, speed: 0.12, rotate: -6, baseRotate: -10 },
]
</script>

<template>
  <main class="home">
    <!-- ── hero ─────────────────────────────────────────────────────── -->
    <section class="hero">
      <FloraField :items="heroFlora" />

      <div class="wrap hero__grid">
        <div class="hero__text">
          <h1 class="display hero__title">
            <span class="hero__line" v-reveal:up="0.05">{{ copy.brand.wordA }}</span>
            <span class="hero__line hero__line--two" v-reveal:up="0.16">
              <em>{{ copy.brand.wordOf }}</em>&nbsp;<span>{{ copy.brand.wordB }}</span>
              <span class="hero__chip" v-plx="{ speed: 0.06, mouse: 0.04 }">
                <img src="/images/kisori/kisori.jpg" alt="Kisori, founder of Peace of Mind Birth Education" />
              </span>
            </span>
          </h1>
          <p class="lead hero__tagline" v-reveal:up="0.34">{{ data.about.tagline }}</p>
          <div class="hero__actions" v-reveal:up="0.46">
            <RouterLink to="/offer" class="pill pill--iris">{{ copy.home.heroCta }}</RouterLink>
            <RouterLink to="/about" class="hero__link">
              <span>{{ copy.home.heroLink }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </RouterLink>
          </div>
        </div>

        <div class="hero__media" v-plx="{ speed: 0.05 }">
          <div class="hero__photo mask-pill" v-grow v-reveal:mask="0.3">
            <img src="/images/pregnancy/pregnancy1.jpg" alt="Expecting parent cradling their belly" />
          </div>
        </div>
      </div>

      <div class="hero__marquee hairline-top">
        <MarqueeStrip :items="marqueeItems" />
      </div>
    </section>

    <!-- ── services ─────────────────────────────────────────────────── -->
    <section class="services">
      <FloraField :items="servicesFlora" />
      <div class="wrap services__inner">
        <h2 class="display d-xl services__heading" v-reveal>
          <span>{{ copy.home.servicesA }}</span> <em>{{ copy.home.servicesEm }}</em> <span>{{ copy.home.servicesB }}</span>
        </h2>
        <ServiceIndex />
      </div>
    </section>

    <!-- ── meet kisori ──────────────────────────────────────────────── -->
    <section class="meet wrap">
      <div class="meet__media" v-plx="{ speed: 0.045 }">
        <div class="meet__photo mask-arch" v-grow v-reveal:mask>
          <!-- bound, not static: .heic in /public must not become a module import -->
          <img :src="'/images/kisori/kisori2.heic'" alt="Kisori smiling" />
        </div>
        <div class="meet__bloom" aria-hidden="true">
          <FloraField
            :items="[{ art: 'flower1', at: { inset: '0' }, size: '100%', tint: 'var(--rose)', opacity: 0.9, speed: 0.15, baseRotate: -18, rotate: 8, mouse: 0.03 }]"
          />
        </div>
      </div>
      <div class="meet__text">
        <h2 class="display d-xl" v-reveal>
          <span>{{ copy.shared.hiA }}</span> <em>{{ copy.shared.hiEm }}</em>
        </h2>
        <WordReveal :text="data.about.bioShort" tag="p" class="body-xl meet__bio" :step="0.012" />
        <RouterLink to="/about" class="pill meet__btn" v-reveal:up="0.2">
          {{ copy.home.meetBtn }}
        </RouterLink>
      </div>
    </section>

    <!-- ── evidence ─────────────────────────────────────────────────── -->
    <section class="evidence mesh">
      <FloraField :items="evidenceFlora" />
      <div class="wrap evidence__inner">
        <h2 class="display d-xl evidence__heading" v-reveal>
          <span>{{ copy.home.evidenceA }}</span> <em>{{ copy.home.evidenceEm }}</em> <span>{{ copy.home.evidenceB }}</span>
        </h2>
        <div class="evidence__grid">
          <article
            v-for="(item, i) in research"
            :key="i"
            class="evidence__card"
            :class="`evidence__card--${i % 2 ? 'mint' : 'blush'}`"
            v-reveal:up="i * 0.12"
          >
            <h3 class="display d-md evidence__hook"><em>{{ item.hook }}</em></h3>
            <p class="evidence__lead">{{ item.lead }}</p>
            <ul class="evidence__list">
              <li v-for="(b, j) in item.bullets" :key="j">
                <span class="dot" />{{ b }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- ── reviews ──────────────────────────────────────────────────── -->
    <section class="voices wrap">
      <h2 class="display d-xl voices__heading" v-reveal>
        <span>{{ copy.home.voicesA }}</span> <em>{{ copy.home.voicesEm }}</em>
      </h2>
      <ReviewsCarousel />
    </section>

    <!-- ── gallery ──────────────────────────────────────────────────── -->
    <section class="gallery">
      <h2 class="display d-xl gallery__heading wrap" v-reveal>
        <span>{{ copy.home.galleryA }}</span> <em>{{ copy.home.galleryEm }}</em>
      </h2>
      <GalleryDrift />
    </section>

    <CtaBand :heading="copy.home.ctaHeading" :sub="copy.home.ctaSub" :label="copy.nav.cta" />
  </main>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.home { overflow-x: clip; }

// ── hero ───────────────────────────────────────────────────────────────
.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  padding-top: 4.75rem;
}

.hero__grid {
  position: relative;
  z-index: 1;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(1rem, 2.5vw, 2.5rem);
  width: 100%;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    align-content: center;
    gap: 3rem;
    padding-block: 2rem;
  }
}

.hero__text {
  position: relative;
  z-index: 2;   // the photo pill may overlap the hero photo's edge
}

.hero__title {
  font-size: clamp(4rem, 11.5vw, 10rem);
  line-height: 0.96;
}

.hero__line {
  display: block;

  &--two {
    display: flex;
    align-items: center;
    padding-left: clamp(1.5rem, 6vw, 6rem);
    white-space: nowrap;
  }
}

// inline photo pill, sized in em so it scales with the headline itself.
// The pill shape lives on the img (not the wrapper); the reveal system no
// longer clips non-mask elements, so nothing can square this off.
.hero__chip {
  display: block;
  height: 1.75em;
  width: 1.75em;
  margin-left: 0.3em;
  flex: none;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 30%;
    border-radius: 50%;
    box-shadow: 0 16px 36px rgba(43, 31, 61, 0.16);
    animation: chipIn 1.4s var(--ease) 0.45s both;
  }
}

@keyframes chipIn {
  from { opacity: 0; transform: scale(0.72); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .hero__chip img { animation: none; }
}

.hero__tagline {
  max-width: 40ch;
  margin-top: clamp(1.4rem, 3vw, 2.4rem);
}

.hero__actions {
  display: flex;
  align-items: center;
  gap: 1.8rem;
  margin-top: clamp(1.8rem, 3vw, 2.6rem);
  flex-wrap: wrap;
}

.hero__link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 500;
  font-size: 0.98rem;

  svg {
    width: 1.05rem; height: 1.05rem;
    transition: transform 0.55s var(--ease);
  }

  &:hover svg { transform: translateX(6px); }
}

.hero__media {
  display: flex;
  justify-content: flex-end;

  @media (max-width: 860px) { justify-content: center; }
}

.hero__photo {
  width: clamp(300px, 37vw, 600px);
  aspect-ratio: 3 / 3.8;
  max-height: min(74vh, 780px);

  img { width: 100%; height: 100%; object-fit: cover; }
}

.hero__marquee {
  position: relative;
  z-index: 1;
  padding-block: clamp(1.1rem, 2vw, 1.7rem);
  background: rgba(251, 247, 240, 0.7);
  backdrop-filter: blur(6px);
}

// ── services ───────────────────────────────────────────────────────────
.services {
  position: relative;
  padding-block: $section calc($section / 1.6);
  overflow: clip;
}

.services__inner { position: relative; z-index: 1; }

.services__heading { margin-bottom: clamp(2.5rem, 5vw, 4.5rem); }

// ── meet ───────────────────────────────────────────────────────────────
.meet {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.45fr);
  gap: clamp(2rem, 6vw, 7rem);
  align-items: center;
  padding-block: calc($section / 1.6);

  @media (max-width: 860px) { grid-template-columns: 1fr; }
}

.meet__media { position: relative; }

.meet__photo {
  aspect-ratio: 3 / 3.9;
  // the source photo is very tall (≈1:2); keep the crop anchored to the
  // top so cover discards legs, not the head
  img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; }
}

.meet__bloom {
  position: absolute;
  right: -14%;
  bottom: -8%;
  width: clamp(110px, 12vw, 190px);
  aspect-ratio: 1;
}

.meet__bio {
  margin-top: clamp(1.6rem, 3vw, 2.4rem);
  font-size: $body-xl;
  line-height: 1.55;
  font-weight: 300;
  max-width: 30em;
}

.meet__btn { margin-top: 2.2rem; }

// ── evidence ───────────────────────────────────────────────────────────
.evidence {
  position: relative;
  background-color: $ink;
  --mesh:
    radial-gradient(52% 58% at 88% 6%, rgba(106, 74, 227, 0.55) 0%, rgba(106, 74, 227, 0) 70%),
    radial-gradient(44% 54% at 6% 88%, rgba(224, 64, 127, 0.32) 0%, rgba(224, 64, 127, 0) 70%),
    radial-gradient(42% 52% at 55% 108%, rgba(74, 47, 189, 0.5) 0%, rgba(74, 47, 189, 0) 75%),
    linear-gradient(160deg, #2b1f3d 0%, #241a36 100%);
  color: $cream;
  padding-block: $section;
  border-radius: clamp(36px, 6vw, 72px);
  margin-inline: clamp(0.6rem, 1.5vw, 1.4rem);
}

.evidence__inner { position: relative; z-index: 1; }

.evidence__heading { max-width: 14em; }

.evidence__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(1.5rem, 4vw, 4rem);
  margin-top: clamp(3rem, 6vw, 5rem);

  @media (max-width: 860px) { grid-template-columns: 1fr; }
}

.evidence__card {
  &--blush { --pop: #{$blush}; --accent: #{$rose}; }
  &--mint { --pop: #{$mint}; --accent: #{$meadow}; }
}

.evidence__hook {
  color: var(--pop);
  max-width: 20em;
}

.evidence__lead {
  margin-top: 1.4rem;
  color: rgba(255, 253, 248, 0.78);
  max-width: 48ch;
  line-height: 1.7;
}

.evidence__list {
  list-style: none;
  margin: 1.6rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  li {
    display: flex;
    align-items: baseline;
    gap: 0.8rem;
    color: rgba(255, 253, 248, 0.92);
    font-weight: 300;
  }
}

// ── voices ─────────────────────────────────────────────────────────────
.voices { padding-block: $section calc($section / 2); }

.voices__heading { text-align: center; margin-bottom: 1rem; }

// ── gallery ────────────────────────────────────────────────────────────
.gallery {
  padding-block: calc($section / 2);
  overflow: clip;
}

.gallery__heading { margin-bottom: clamp(2.5rem, 5vw, 4rem); }
</style>
