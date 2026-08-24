<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteNav from '@/components/SiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'
</script>

<template>
  <div class="app">
    <SiteNav />
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
    <SiteFooter />
  </div>
</template>

<style lang="scss">
.page-enter-active,
.page-leave-active {
  transition: opacity 0.55s var(--ease), transform 0.55s var(--ease);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(26px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active { transition: none; }
}
</style>
