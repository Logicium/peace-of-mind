<script setup lang="ts">
/*
 * A field of the site's botanical line art, layered in depth.
 * Each item gets its own parallax speed / rotation drift / blur, so on
 * scroll the layers separate and the field reads as three-dimensional.
 * Purely decorative: aria-hidden, pointer-events none.
 */
import type { Component } from 'vue'
import { defineAsyncComponent } from 'vue'

/*
 * The line art is hundreds of KB of path data, so each flower is its own
 * async chunk: the page paints immediately and the field blooms in as the
 * chunks arrive (see the floraIn animation below).
 */
const RoseArt = defineAsyncComponent(() => import('@/assets/line-art/RoseArt.vue'))
const CarnationArt = defineAsyncComponent(() => import('@/assets/line-art/CarnationArt.vue'))
const LilyArt = defineAsyncComponent(() => import('@/assets/line-art/LilyArt.vue'))
const LotusArt = defineAsyncComponent(() => import('@/assets/line-art/LotusArt.vue'))
const FlowerArt1 = defineAsyncComponent(() => import('@/assets/line-art/FlowerArt1.vue'))
const FlowerArt2 = defineAsyncComponent(() => import('@/assets/line-art/FlowerArt2.vue'))
const FlowerArt3 = defineAsyncComponent(() => import('@/assets/line-art/FlowerArt3.vue'))
const BranchArt = defineAsyncComponent(() => import('@/assets/line-art/BranchArt.vue'))
const StemArt1 = defineAsyncComponent(() => import('@/assets/line-art/StemArt1.vue'))
const StemArt2 = defineAsyncComponent(() => import('@/assets/line-art/StemArt2.vue'))
const StemArt3 = defineAsyncComponent(() => import('@/assets/line-art/StemArt3.vue'))

export interface FloraItem {
  art: keyof typeof arts
  /** css positions, e.g. { top: '10%', left: '-4%' } */
  at: Record<string, string>
  size: string
  tint: string
  opacity?: number
  blur?: number
  speed?: number
  rotate?: number
  baseRotate?: number
  mouse?: number
  z?: number
}

const arts: Record<string, Component> = {
  rose: RoseArt,
  carnation: CarnationArt,
  lily: LilyArt,
  lotus: LotusArt,
  flower1: FlowerArt1,
  sakura: FlowerArt2,
  poppy: FlowerArt3,
  branch: BranchArt,
  stem1: StemArt1,
  stem2: StemArt2,
  stem3: StemArt3,
}

defineProps<{ items: FloraItem[] }>()
</script>

<template>
  <div class="flora" aria-hidden="true">
    <div
      v-for="(f, i) in items"
      :key="i"
      class="flora__item"
      :style="{ ...f.at, width: f.size, zIndex: f.z ?? 0 }"
      v-plx="{
        speed: f.speed ?? 0.08,
        rotate: f.rotate ?? 0,
        baseRotate: f.baseRotate ?? 0,
        mouse: f.mouse ?? 0,
      }"
    >
      <div
        class="flora__art"
        :style="{
          color: f.tint,
          opacity: f.opacity ?? 1,
          filter: f.blur ? `blur(${f.blur}px)` : undefined,
        }"
      >
        <component :is="arts[f.art]" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.flora {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.flora__item {
  position: absolute;
  aspect-ratio: 1;
}

.flora__art {
  width: 100%;
  height: 100%;

  :deep(svg) {
    width: 100%;
    height: 100%;
    display: block;
    animation: floraIn 1.6s var(--ease) both;
  }
}

@keyframes floraIn {
  from { opacity: 0; transform: scale(0.94); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .flora__art :deep(svg) { animation: none; }
}
</style>
