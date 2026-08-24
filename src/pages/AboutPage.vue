<script setup lang="ts">
import data from '@/data/data'

const copy = data.copy
import FloraField from '@/components/FloraField.vue'
import type { FloraItem } from '@/components/FloraField.vue'
import WordReveal from '@/components/WordReveal.vue'
import CtaBand from '@/components/CtaBand.vue'

const heroFlora: FloraItem[] = [
  { art: 'lily', at: { top: '6%', left: '-7%' }, size: 'clamp(220px, 26vw, 440px)', tint: 'var(--lilac)', opacity: 0.9, blur: 2, speed: 0.05, rotate: 4, baseRotate: -10, mouse: 0.015 },
  { art: 'poppy', at: { bottom: '4%', right: '34%' }, size: 'clamp(130px, 14vw, 240px)', tint: 'var(--rose)', opacity: 0.85, speed: 0.16, rotate: -8, baseRotate: 14, mouse: 0.04, z: 2 },
  { art: 'stem1', at: { top: '18%', right: '2%' }, size: 'clamp(90px, 10vw, 160px)', tint: 'var(--meadow)', opacity: 0.8, speed: 0.11, baseRotate: 26, mouse: 0.03 },
]

const missionFlora: FloraItem[] = [
  { art: 'lotus', at: { bottom: '-24%', right: '-4%' }, size: 'clamp(180px, 20vw, 320px)', tint: 'var(--iris)', opacity: 0.22, speed: 0.1, rotate: 5, baseRotate: 8 },
]
</script>

<template>
  <main class="about">
    <!-- ── hero ─────────────────────────────────────────────────────── -->
    <section class="hero">
      <FloraField :items="heroFlora" />
      <div class="wrap hero__grid">
        <div class="hero__text">
          <h1 class="display hero__title">
            <span v-reveal:up="0.05">{{ copy.shared.hiA }}</span>
            <span class="hero__name" v-reveal:up="0.16"><em>{{ copy.shared.hiEm }}</em></span>
          </h1>
          <WordReveal :text="data.about.intro" tag="p" class="hero__intro" :step="0.008" :delay="0.3" />
        </div>
        <div class="hero__media" v-plx="{ speed: 0.05 }">
          <div class="hero__photo mask-arch" v-grow v-reveal:mask="0.25">
            <!-- bound, not static: .heic in /public must not become a module import -->
            <img :src="'/images/kisori/kisori3.heic'" alt="Kisori, certified childbirth educator" />
          </div>
        </div>
      </div>
    </section>

    <!-- ── mission ──────────────────────────────────────────────────── -->
    <section class="mission">
      <div class="mission__band">
        <FloraField :items="missionFlora" />
        <div class="wrap mission__inner">
          <h2 class="display d-lg mission__heading" v-reveal>
            <span>{{ copy.about.missionA }}</span> <em>{{ copy.about.missionEm }}</em>
          </h2>
          <WordReveal
            :text="data.about.introShort"
            tag="p"
            class="display mission__statement"
            :step="0.012"
          />
        </div>
      </div>
    </section>

    <!-- ── credentials ──────────────────────────────────────────────── -->
    <section class="creds wrap">
      <div class="creds__col">
        <h2 class="display d-lg" v-reveal>{{ copy.about.certsHeading }}</h2>
        <ol class="creds__list">
          <li v-for="(cert, i) in data.certs" :key="i" v-reveal:up="i * 0.07">
            <span class="creds__num fr">{{ String(i + 1).padStart(2, '0') }}</span>
            <span>{{ cert }}</span>
          </li>
        </ol>
      </div>
      <div class="creds__col">
        <h2 class="display d-lg" v-reveal>{{ copy.about.membershipsHeading }}</h2>
        <ol class="creds__list creds__list--rose">
          <li v-for="(membership, i) in data.memberships" :key="i" v-reveal:up="i * 0.07">
            <span class="creds__num fr">{{ String(i + 1).padStart(2, '0') }}</span>
            <span>{{ membership }}</span>
          </li>
        </ol>
      </div>
    </section>

    <CtaBand :heading="copy.about.ctaHeading" :sub="copy.about.ctaSub" :label="copy.nav.cta" />
  </main>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

// ── hero ───────────────────────────────────────────────────────────────
.hero {
  position: relative;
  padding-top: calc(4.75rem + clamp(2rem, 6vw, 5rem));
}

.hero__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 6rem);
  align-items: start;

  @media (max-width: 860px) { grid-template-columns: 1fr; }
}

.hero__title {
  font-size: clamp(3.2rem, 8.5vw, 7.5rem);
  line-height: 1;

  span { display: block; }
}

.hero__name {
  padding-left: clamp(1.2rem, 4vw, 4rem);
  color: $iris;
}

.hero__intro {
  margin-top: clamp(2rem, 4vw, 3.2rem);
  font-size: $body-lg;
  line-height: 1.75;
  color: $ink-soft;
  max-width: 56ch;
}

.hero__media {
  display: flex;
  justify-content: flex-end;
  @media (max-width: 860px) { justify-content: center; }
}

.hero__photo {
  width: clamp(260px, 28vw, 420px);
  aspect-ratio: 3 / 4;
  img { width: 100%; height: 100%; object-fit: cover; }
}

// ── mission ────────────────────────────────────────────────────────────
.mission { padding-block: $section calc($section / 1.8); }

.mission__band {
  position: relative;
  background: $lilac;
  border-radius: clamp(36px, 6vw, 72px);
  margin-inline: clamp(0.6rem, 1.5vw, 1.4rem);
  overflow: hidden;
  padding-block: clamp(4rem, 8vw, 7rem);
}

.mission__inner {
  position: relative;
  z-index: 1;
  text-align: center;
}

.mission__heading em { color: $iris; }

.mission__statement {
  margin-top: clamp(1.8rem, 3.5vw, 2.8rem);
  font-size: clamp(1.4rem, 2.6vw, 2.2rem);
  line-height: 1.45;
  font-weight: 360;
  max-width: 34em;
  margin-inline: auto;
}

// ── credentials ────────────────────────────────────────────────────────
.creds {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(2.5rem, 6vw, 7rem);
  padding-block: calc($section / 1.8);

  @media (max-width: 760px) { grid-template-columns: 1fr; }
}

.creds__list {
  --accent: #{$iris};
  list-style: none;
  margin: clamp(1.6rem, 3vw, 2.4rem) 0 0;
  padding: 0;

  &--rose { --accent: #{$rose}; }

  li {
    display: flex;
    align-items: baseline;
    gap: 1.3rem;
    padding-block: 1.15rem;
    border-bottom: 1px solid $hairline;
    font-size: 1.05rem;
    font-weight: 300;
    line-height: 1.5;
    transition: padding-left 0.6s var(--ease);

    &:hover { padding-left: 0.6rem; }
  }
}

.creds__num {
  font-style: italic;
  color: var(--accent);
  font-size: 0.95rem;
  min-width: 2em;
  flex: none;
}
</style>
