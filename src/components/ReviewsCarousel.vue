<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import data from '@/data/data'

const current = ref(0)
const count = data.reviews.length
let timer = 0

const go = (i: number) => {
  current.value = ((i % count) + count) % count
  restart()
}

const restart = () => {
  window.clearInterval(timer)
  timer = window.setInterval(() => {
    current.value = (current.value + 1) % count
  }, 10000)
}

onMounted(restart)
onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="reviews" v-reveal>
    <div class="reviews__stage">
      <Transition name="quote" mode="out-in">
        <figure :key="current" class="reviews__quote">
          <blockquote class="display" v-html="data.reviews[current].text" />
          <figcaption>
            <span class="reviews__name">{{ data.reviews[current].name }}</span>
            <span class="reviews__stars" aria-label="rating">
              <i
                v-for="n in data.reviews[current].rating"
                :key="n"
                class="reviews__star"
              />
            </span>
          </figcaption>
        </figure>
      </Transition>
    </div>

    <div class="reviews__controls">
      <button class="reviews__arrow" aria-label="Previous review" @click="go(current - 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <div class="reviews__dots">
        <button
          v-for="(_, i) in data.reviews"
          :key="i"
          class="reviews__dot"
          :class="{ 'reviews__dot--on': i === current }"
          :aria-label="`Review ${i + 1}`"
          @click="go(i)"
        />
      </div>
      <button class="reviews__arrow" aria-label="Next review" @click="go(current + 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.reviews { text-align: center; }

.reviews__stage {
  min-height: clamp(280px, 38vw, 420px);
  display: grid;
  place-items: center;
}

.reviews__quote {
  margin: 0;
  max-width: 62rem;
  margin-inline: auto;

  blockquote {
    margin: 0;
    font-size: clamp(1.35rem, 2.6vw, 2.1rem);
    line-height: 1.42;
    font-weight: 360;
    quotes: "\201C" "\201D";

    &::before { content: open-quote; color: $rose; margin-right: 0.1em; }
    &::after { content: close-quote; color: $rose; margin-left: 0.1em; }

    :deep(u) {
      text-decoration: none;
      background-image: linear-gradient(transparent 62%, rgba(224, 64, 127, 0.22) 62%);
    }
  }

  figcaption {
    margin-top: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
}

.reviews__name {
  font-weight: 500;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

.reviews__stars { display: inline-flex; gap: 0.3rem; }

.reviews__star {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: $iris;

  &:nth-child(2n) { background: $rose; }
}

.reviews__controls {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;
}

.reviews__arrow {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 1.5px solid $ink;
  background: none;
  color: $ink;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background-color 0.5s var(--ease), color 0.5s var(--ease);

  svg { width: 1.1rem; height: 1.1rem; }

  &:hover { background: $ink; color: $cream; }
}

.reviews__dots { display: flex; gap: 0.6rem; }

.reviews__dot {
  width: 0.55rem;
  height: 0.55rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(43, 31, 61, 0.22);
  cursor: pointer;
  transition: transform 0.5s var(--ease), background-color 0.5s;

  &--on { background: $rose; transform: scale(1.5); }
}

.quote-enter-active,
.quote-leave-active { transition: opacity 0.7s var(--ease), transform 0.7s var(--ease); }
.quote-enter-from { opacity: 0; transform: translateY(26px); }
.quote-leave-to { opacity: 0; transform: translateY(-18px); }
</style>
