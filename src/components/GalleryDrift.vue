<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import data from '@/data/data'

/*
 * The gallery is a window: two long filmstrips travel leftward inside an
 * overflow-hidden container, driven by the section's scroll progress. The
 * translate range is exactly [0, stripWidth - windowWidth], so the window
 * is always fully covered — images can never be cut off or leave gaps.
 * Progress is pre-advanced (~30%) so the strips are already mid-journey
 * when the section scrolls into view.
 *
 * Shapes: circles alternating with wide pills of the same height, the two
 * rows offset so a circle always sits above a pill.
 */
const posts = data.instagramPosts

/* strips repeat the set once for length; the second starts rotated so
   vertical neighbors always differ */
const rowA = [...posts, ...posts]
const rowB = [...posts.slice(3), ...posts.slice(0, 3), ...posts.slice(3), ...posts.slice(0, 3)]

const windowEl = ref<HTMLElement>()
const rowAEl = ref<HTMLElement>()
const rowBEl = ref<HTMLElement>()

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let top = 0
let height = 0
let travelA = 0
let travelB = 0
let curA = -1
let curB = -1
let rafId = 0
let ro: ResizeObserver | undefined

const measure = () => {
  const el = windowEl.value
  if (!el) return
  let t = 0
  let n: HTMLElement | null = el
  while (n) {
    t += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  top = t
  height = el.offsetHeight
  const winW = el.clientWidth
  travelA = Math.max(0, (rowAEl.value?.scrollWidth ?? 0) - winW)
  travelB = Math.max(0, (rowBEl.value?.scrollWidth ?? 0) - winW)
}

const frame = () => {
  const vh = window.innerHeight
  const p = Math.min(1, Math.max(0, (window.scrollY + vh - top) / (vh + height)))
  // both rows move the same direction; the lower one lags for depth.
  // Each row drifts through only ~a quarter of its full range so the
  // motion stays calm; starting mid-range keeps it pre-scrolled in.
  const targetA = Math.min(1, 0.35 + p * 0.27) * travelA
  const targetB = Math.min(1, 0.25 + p * 0.22) * travelB
  curA = curA < 0 ? targetA : curA + (targetA - curA) * 0.06
  curB = curB < 0 ? targetB : curB + (targetB - curB) * 0.06
  if (rowAEl.value) rowAEl.value.style.transform = `translate3d(${(-curA).toFixed(2)}px, 0, 0)`
  if (rowBEl.value) rowBEl.value.style.transform = `translate3d(${(-curB).toFixed(2)}px, 0, 0)`
  rafId = requestAnimationFrame(frame)
}

onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (windowEl.value) ro.observe(windowEl.value)
  window.addEventListener('resize', measure)
  if (reduced) {
    if (rowAEl.value) rowAEl.value.style.transform = `translate3d(${(-0.4 * travelA).toFixed(2)}px, 0, 0)`
    if (rowBEl.value) rowBEl.value.style.transform = `translate3d(${(-0.3 * travelB).toFixed(2)}px, 0, 0)`
    return
  }
  rafId = requestAnimationFrame(frame)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  ro?.disconnect()
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <div class="drift" v-reveal>
    <div class="drift__window" ref="windowEl">
      <div class="drift__row drift__row--a" ref="rowAEl">
        <div v-for="(post, i) in rowA" :key="`a-${i}`" class="drift__item">
          <img :src="post.image" :alt="post.alt" loading="lazy" />
        </div>
      </div>
      <div class="drift__row drift__row--b" ref="rowBEl">
        <div v-for="(post, i) in rowB" :key="`b-${i}`" class="drift__item">
          <img :src="post.image" :alt="post.alt" loading="lazy" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.drift {
  --h: clamp(250px, 28vw, 400px);
}

.drift__window {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2vw, 1.6rem);
}

.drift__row {
  display: flex;
  gap: clamp(1rem, 2vw, 1.6rem);
  width: max-content;
  will-change: transform;
}

.drift__item {
  height: var(--h);
  flex: none;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 1.6s var(--ease);
  }

  &:hover img { transform: scale(1.05); }
}

// circles alternating with wide pills of the same height; rows offset so a
// circle always sits above a pill
.drift__row--a .drift__item:nth-child(odd),
.drift__row--b .drift__item:nth-child(even) {
  width: var(--h);
  border-radius: 50%;
}
.drift__row--a .drift__item:nth-child(even),
.drift__row--b .drift__item:nth-child(odd) {
  width: calc(var(--h) * 1.7);
  border-radius: 999px;
}
</style>
