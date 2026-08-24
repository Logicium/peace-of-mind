<script setup lang="ts">
import FloraField from '@/components/FloraField.vue'
import type { FloraItem } from '@/components/FloraField.vue'

withDefaults(
  defineProps<{
    heading?: string
    sub?: string
    to?: string
    label?: string
  }>(),
  {
    heading: 'Ready when you are.',
    sub: '',
    to: '/contact',
    label: "Let's connect",
  },
)

const flora: FloraItem[] = [
  { art: 'lily', at: { top: '-22%', left: '-3%' }, size: 'clamp(140px, 16vw, 260px)', tint: 'var(--iris)', opacity: 0.85, speed: 0.14, rotate: 5, baseRotate: -14, mouse: 0.02 },
  { art: 'sakura', at: { bottom: '-18%', right: '4%' }, size: 'clamp(110px, 12vw, 200px)', tint: 'var(--rose)', opacity: 0.9, speed: 0.2, rotate: -7, baseRotate: 18, mouse: 0.03 },
  { art: 'stem2', at: { top: '8%', right: '16%' }, size: 'clamp(80px, 9vw, 150px)', tint: 'var(--meadow)', opacity: 0.75, speed: 0.09, baseRotate: 30 },
]
</script>

<template>
  <section class="cta">
    <div class="wrap">
      <div class="cta__panel mesh" v-reveal:scale>
        <FloraField :items="flora" />
        <h2 class="display d-xl cta__heading">{{ heading }}</h2>
        <p v-if="sub" class="lead cta__sub">{{ sub }}</p>
        <RouterLink :to="to" class="pill pill--iris cta__btn">{{ label }}</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.cta { padding-block: calc($section / 2) $section; }

.cta__panel {
  position: relative;
  text-align: center;
  padding: clamp(4rem, 9vw, 8rem) clamp(1.5rem, 6vw, 6rem);
  border-radius: clamp(36px, 6vw, 72px);
  background-color: #f6efe4;
  --mesh:
    radial-gradient(46% 58% at 15% 22%, rgba(106, 74, 227, 0.38) 0%, rgba(106, 74, 227, 0) 70%),
    radial-gradient(50% 62% at 86% 20%, rgba(224, 64, 127, 0.34) 0%, rgba(224, 64, 127, 0) 70%),
    radial-gradient(54% 60% at 80% 92%, rgba(46, 154, 107, 0.28) 0%, rgba(46, 154, 107, 0) 72%),
    radial-gradient(42% 50% at 28% 90%, rgba(250, 236, 212, 0.95) 0%, rgba(250, 236, 212, 0) 75%),
    linear-gradient(135deg, #fbf7f0 0%, #f3ebdd 100%);
}

.cta__heading { position: relative; }

.cta__sub {
  position: relative;
  max-width: 46ch;
  margin: 1.4rem auto 0;
  color: $ink-soft;
}

.cta__btn { position: relative; margin-top: 2.4rem; }
</style>
