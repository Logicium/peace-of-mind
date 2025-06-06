<script setup lang="ts">
defineProps<{
  isActive: boolean;
}>();
</script>

<template>
  <div class="icon-toggle">
    <div :class="!isActive ? 'toggleIcon rotateIn' : 'toggleIcon'">
      <slot name="inactive"></slot>
    </div>
    <div :class="isActive ? 'toggleIcon rotateIn' : 'toggleIcon'">
      <slot name="active"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.icon-toggle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggleIcon {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: rotate(0deg);
  transition: transform 1s ease, opacity 1s ease;
}

.rotateIn {
  transform: rotate(180deg);
  transition: transform 1s ease, opacity 1s ease;
  opacity: 1;
}
</style>
