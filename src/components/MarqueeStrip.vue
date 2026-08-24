<script setup lang="ts">
import FlowerArt2 from '@/assets/line-art/FlowerArt2.vue'

withDefaults(
  defineProps<{
    items: string[]
    /** seconds per loop */
    duration?: number
  }>(),
  { duration: 46 },
)
</script>

<template>
  <div class="marquee" aria-hidden="true">
    <div class="marquee__track" :style="{ animationDuration: `${duration}s` }">
      <template v-for="n in 2" :key="n">
        <span v-for="(item, i) in [...items, ...items]" :key="`${n}-${i}`" class="marquee__cell">
          <em>{{ item }}</em>
          <span class="marquee__glyph"><FlowerArt2 /></span>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/Text.scss";
@import "../assets/Colors.scss";

.marquee {
  overflow: hidden;
  white-space: nowrap;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}

.marquee__track {
  display: inline-flex;
  align-items: center;
  animation: drift linear infinite;
  will-change: transform;
}

.marquee__cell {
  display: inline-flex;
  align-items: center;
  gap: clamp(1.5rem, 3vw, 3rem);
  padding-right: clamp(1.5rem, 3vw, 3rem);
  font-family: $font-display;
  font-size: $display-md;
  font-weight: 360;
  letter-spacing: -0.01em;

  em { font-style: italic; }
}

.marquee__glyph {
  width: 1.15em;
  height: 1.15em;
  color: $rose;

  :deep(svg) { width: 100%; height: 100%; display: block; }
}

.marquee__cell:nth-child(3n) .marquee__glyph { color: $iris; }
.marquee__cell:nth-child(3n + 1) .marquee__glyph { color: $meadow; }

@keyframes drift {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .marquee__track { animation: none; }
}
</style>
