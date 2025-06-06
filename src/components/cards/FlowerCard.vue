<script setup lang="ts">
import { defineProps } from 'vue';

// Define props for the component
defineProps({
  // Size options for the flower
  size: {
    type: String,
    default: 'medium',
    validator: (value: string) => ['small', 'medium', 'big'].includes(value)
  },
  // Position customization
  position: {
    type: Object,
    default: () => ({})
  },
  // Color customization (uses primary color by default)
  color: {
    type: String,
    default: ''
  },
  // Optional rotation
  rotation: {
    type: Number,
    default: 0
  },
  // Z-index for layering
  zIndex: {
    type: Number,
    default: 1
  }
});
</script>

<template>
  <div class="flower-card" :class="[size]" :style="{
    transform: `rotate(${rotation}deg)`,
    zIndex: zIndex,
    color: color,
    ...position
  }">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
@import "../../assets/Colors";

.flower-card {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  color: $primary; // Default color

  :deep(svg) {
    width: 100%;
    height: 100%;
  }

  &.small {
    width: calc(100px + 4vw);
    height: calc(100px + 4vw);
  }

  &.medium {
    width: calc(150px + 4vw);
    height: calc(150px + 4vw);
  }

  &.big {
    width: calc(200px + 4vw);
    height: calc(200px + 4vw);
  }
}

@media (max-width: 768px) {
  .flower-card {
    &.small {
      width: calc(75px + 4vw);
      height: calc(75px + 4vw);
    }

    &.medium {
      width: calc(100px + 4vw);
      height: calc(100px + 4vw);
    }

    &.big {
      width: calc(150px + 4vw);
      height: calc(150px + 4vw);
    }
  }
}
</style>
