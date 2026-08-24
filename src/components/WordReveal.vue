<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    tag?: string
    /** seconds between words */
    step?: number
    /** initial delay, seconds */
    delay?: number
  }>(),
  { tag: 'p', step: 0.03, delay: 0 },
)

const words = computed(() => props.text.split(/\s+/).filter(Boolean))
</script>

<template>
  <component :is="tag" class="wr" v-reveal:stagger>
    <span
      v-for="(w, i) in words"
      :key="i"
      class="w"
      :style="{ '--rv-delay': `${(delay + i * step).toFixed(3)}s` }"
      ><span class="wi">{{ w }}</span></span
    >
  </component>
</template>

<style scoped>
.w { margin-right: 0.27em; }
.w:last-child { margin-right: 0; }
</style>
