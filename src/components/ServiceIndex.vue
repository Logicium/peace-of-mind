<script setup lang="ts">
import { ref } from 'vue'
import data from '@/data/data'

/*
 * Editorial service index: oversized numbered rows that breathe open.
 * Order matches data.services; anchors land on the matching chapter
 * of the What I Offer page.
 */
const anchors = ['birth-plan', 'childbirth', 'doula', 'car-seat']
const accents = ['var(--iris)', 'var(--rose)', 'var(--meadow)', 'var(--amber)']
const tints = ['var(--lilac)', 'var(--blush)', 'var(--mint)', 'var(--butter)']

const active = ref(0)

const toggle = (i: number) => {
  active.value = active.value === i ? -1 : i
}
</script>

<template>
  <div class="index">
    <div
      v-for="(service, i) in data.services"
      :key="i"
      class="row"
      :class="{ 'row--open': active === i }"
      :style="{ '--accent': accents[i % accents.length], '--tint': tints[i % tints.length] }"
      v-reveal="i * 0.06"
    >
      <button
        class="row__head"
        :aria-expanded="active === i"
        @click="toggle(i)"
      >
        <span class="row__num fr">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="row__name display d-lg">{{ service.name }}</span>
        <span class="row__toggle" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" class="row__vert" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>

      <div class="row__body">
        <div class="row__bodyInner">
          <div class="row__content">
            <p class="row__desc lead">{{ service.desc }}</p>
            <RouterLink :to="`/offer#${anchors[i]}`" class="pill row__more">
              {{ data.copy.services.seeDetails }}
            </RouterLink>
          </div>
          <div class="row__media mask-pill">
            <img :src="service.image" :alt="service.name" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.index { border-top: 1px solid $hairline; }

.row {
  border-bottom: 1px solid $hairline;
  border-radius: 0;
  transition: background-color 0.7s var(--ease), border-radius 0.7s var(--ease);

  &--open {
    background: var(--tint);
    border-radius: clamp(24px, 3vw, 44px);
    border-bottom-color: transparent;
  }
}

.row__head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: clamp(1.2rem, 3.5vw, 3rem);
  width: 100%;
  padding: clamp(1.4rem, 3vw, 2.4rem) clamp(0.5rem, 2vw, 2rem);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font: inherit;
}

.row__num {
  font-size: clamp(1.1rem, 2vw, 1.6rem);
  font-style: italic;
  font-weight: 400;
  color: var(--accent);
  min-width: 2.2em;
}

.row__name {
  transition: transform 0.7s var(--ease);
}

.row:hover:not(.row--open) .row__name { transform: translateX(clamp(6px, 1vw, 14px)); }

.row__toggle {
  width: 3.1rem;
  height: 3.1rem;
  border-radius: 50%;
  border: 1.5px solid $ink;
  display: grid;
  place-items: center;
  transition: background-color 0.55s var(--ease), color 0.55s var(--ease), transform 0.7s var(--ease);

  svg { width: 1.15rem; height: 1.15rem; }

  .row__vert { transition: opacity 0.4s, transform 0.55s var(--ease); transform-origin: center; }
}

.row--open .row__toggle {
  background: $ink;
  color: $cream;
  border-color: $ink;
  transform: rotate(180deg);

  .row__vert { opacity: 0; transform: scaleY(0); }
}

.row__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.9s var(--ease);
}

.row--open .row__body { grid-template-rows: 1fr; }

.row__bodyInner {
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: clamp(1.5rem, 4vw, 4rem);
  align-items: center;
  padding-inline: clamp(0.5rem, 2vw, 2rem);

  @media (max-width: 760px) { grid-template-columns: 1fr; }
}

.row--open .row__bodyInner { padding-bottom: clamp(1.6rem, 3vw, 2.6rem); }

.row__content {
  padding-left: clamp(0rem, 5vw, 4.9rem);   // aligns under the name
  @media (max-width: 760px) { padding-left: 0; }
}

.row__desc { max-width: 52ch; }

.row__more { margin-top: 1.6rem; height: 2.8rem; padding: 0 1.5rem; font-size: 0.88rem; }

.row__media {
  height: clamp(180px, 24vw, 280px);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.06);
    transition: transform 1.4s var(--ease);
  }
}

.row--open .row__media img { transform: scale(1); }
</style>
