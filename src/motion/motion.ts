/*
 * Hand-rolled motion engine. No dependencies.
 *
 * Three directives share one requestAnimationFrame loop and one lerped
 * scroll value, which is what makes every layer feel like part of the same
 * fluid: nothing reads raw scrollY directly.
 *
 *   v-plx    — depth parallax (+ optional mouse drift and scroll rotation)
 *   v-grow   — writes --p (0 → 1) as the element approaches mid-viewport;
 *              CSS maps it onto scale / radius, so images "breathe" open
 *   v-reveal — IntersectionObserver one-shot reveal (class `in`)
 *
 * Positions are measured through the offsetParent chain (layout position,
 * unaffected by our own transforms) and re-measured on resize and whenever
 * the document height changes.
 */
import type { Directive } from 'vue'

const reduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface PlxOptions {
  /** vertical drift factor; positive = moves up slower than scroll (far away) */
  speed?: number
  /** horizontal drift factor (gallery rows) */
  speedX?: number
  /** degrees of rotation per 1000px of scroll distance from center */
  rotate?: number
  /** base rotation, degrees */
  baseRotate?: number
  /** mouse drift factor (0 = none, ~0.03 subtle) */
  mouse?: number
}

interface PlxItem {
  el: HTMLElement
  o: Required<PlxOptions>
  center: number
}

interface GrowItem {
  el: HTMLElement
  center: number
  half: number
}

interface RevealItem {
  el: HTMLElement
  top: number
}

const plxItems = new Set<PlxItem>()
const growItems = new Set<GrowItem>()
const revealItems = new Set<RevealItem>()
const revealRegistry = new WeakMap<HTMLElement, RevealItem>()

let rafId = 0
let running = false
let smooth = -1
let mouseX = 0
let mouseY = 0
let sMouseX = 0
let sMouseY = 0
let lastDocHeight = 0

function docOffsetTop(el: HTMLElement): number {
  let top = 0
  let node: HTMLElement | null = el
  while (node) {
    top += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return top
}

function measurePlx(item: PlxItem) {
  item.center = docOffsetTop(item.el) + item.el.offsetHeight / 2
}

function measureGrow(item: GrowItem) {
  item.center = docOffsetTop(item.el) + item.el.offsetHeight / 2
  item.half = item.el.offsetHeight / 2
}

function measureReveal(item: RevealItem) {
  item.top = docOffsetTop(item.el)
}

function measureAll() {
  plxItems.forEach(measurePlx)
  growItems.forEach(measureGrow)
  revealItems.forEach(measureReveal)
}

function frame() {
  const vh = window.innerHeight
  const target = window.scrollY

  if (smooth < 0) smooth = target
  smooth += (target - smooth) * 0.085
  if (Math.abs(target - smooth) < 0.05) smooth = target

  sMouseX += (mouseX - sMouseX) * 0.05
  sMouseY += (mouseY - sMouseY) * 0.05

  // layout shifted (images loaded, route changed)? re-measure.
  const h = document.documentElement.scrollHeight
  if (h !== lastDocHeight) {
    lastDocHeight = h
    measureAll()
  }

  const viewCenter = smooth + vh / 2

  plxItems.forEach((item) => {
    const d = item.center - viewCenter
    const y = -d * item.o.speed + sMouseY * item.o.mouse * 60
    const x = -d * item.o.speedX + sMouseX * item.o.mouse * 60
    const r = item.o.baseRotate + (d / 1000) * item.o.rotate
    item.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${r.toFixed(2)}deg)`
  })

  growItems.forEach((item) => {
    const d = item.center - viewCenter
    const p = Math.min(1, Math.max(0, 1 - d / (vh * 0.55 + item.half)))
    item.el.style.setProperty('--p', p.toFixed(3))
  })

  // reveal line sits at 88% of the viewport; anything at or above it fires.
  // Uses the raw scroll target, not the lerped value, so reveals feel prompt.
  const revealLine = target + vh * 0.88
  revealItems.forEach((item) => {
    if (item.top < revealLine) {
      item.el.classList.add('in')
      revealItems.delete(item)
      revealRegistry.delete(item.el)
    }
  })

  rafId = requestAnimationFrame(frame)
}

function onMouse(e: MouseEvent) {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1
  mouseY = (e.clientY / window.innerHeight) * 2 - 1
}

function start() {
  if (running || reduced) return
  running = true
  lastDocHeight = document.documentElement.scrollHeight
  measureAll()
  window.addEventListener('resize', measureAll)
  window.addEventListener('mousemove', onMouse, { passive: true })
  rafId = requestAnimationFrame(frame)
}

function stopIfIdle() {
  if (plxItems.size || growItems.size || revealItems.size || !running) return
  running = false
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', measureAll)
  window.removeEventListener('mousemove', onMouse)
}

// ── v-plx ──────────────────────────────────────────────────────────────
const plxRegistry = new WeakMap<HTMLElement, PlxItem>()

export const vPlx: Directive<HTMLElement, PlxOptions | undefined> = {
  mounted(el, binding) {
    if (reduced) return
    const v = binding.value ?? {}
    const item: PlxItem = {
      el,
      o: {
        speed: v.speed ?? 0.1,
        speedX: v.speedX ?? 0,
        rotate: v.rotate ?? 0,
        baseRotate: v.baseRotate ?? 0,
        mouse: v.mouse ?? 0,
      },
      center: 0,
    }
    el.style.willChange = 'transform'
    plxItems.add(item)
    plxRegistry.set(el, item)
    measurePlx(item)
    start()
  },
  unmounted(el) {
    const item = plxRegistry.get(el)
    if (item) {
      plxItems.delete(item)
      plxRegistry.delete(el)
    }
    stopIfIdle()
  },
}

// ── v-grow ─────────────────────────────────────────────────────────────
const growRegistry = new WeakMap<HTMLElement, GrowItem>()

export const vGrow: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add('grow')
    if (reduced) {
      el.style.setProperty('--p', '1')
      return
    }
    const item: GrowItem = { el, center: 0, half: 0 }
    growItems.add(item)
    growRegistry.set(el, item)
    measureGrow(item)
    start()
  },
  unmounted(el) {
    const item = growRegistry.get(el)
    if (item) {
      growItems.delete(item)
      growRegistry.delete(el)
    }
    stopIfIdle()
  },
}

// ── v-reveal ───────────────────────────────────────────────────────────
// Driven by the same rAF loop as parallax, NOT IntersectionObserver: IO can
// report ratio 0 for on-screen elements while rendering is throttled (hidden
// or embedded panes), which left whole sections stuck at opacity 0. The loop
// compares document offsets against the scroll position, so a reveal can
// never be missed — anything at or above the reveal line fires the moment a
// frame runs.

/** usage: v-reveal, v-reveal:mask, v-reveal:left="0.2" (arg = variant, value = delay s) */
export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    const variant = binding.arg ?? 'up'
    el.classList.add('rv')
    el.dataset.rv = variant
    if (binding.value) el.style.setProperty('--rv-delay', `${binding.value}s`)
    if (reduced) {
      el.classList.add('in')
      return
    }
    const item: RevealItem = { el, top: 0 }
    measureReveal(item)
    revealItems.add(item)
    revealRegistry.set(el, item)
    start()
  },
  unmounted(el) {
    const item = revealRegistry.get(el)
    if (item) {
      revealItems.delete(item)
      revealRegistry.delete(el)
    }
    stopIfIdle()
  },
}

export const motionReduced = reduced
