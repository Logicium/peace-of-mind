<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  text: string;
  name: string;
  rating?: number;
}>();

const isExpanded = ref(false);
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value <= 480);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function handleResize() {
  windowWidth.value = window.innerWidth;
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
<div class="card">
  <div class="review-text-container" :class="{ 'collapsed': isMobile && !isExpanded }">
    <h2 class="review-text" v-html="''+text"></h2>
  </div>
  <button v-if="isMobile" @click="toggleExpand" class="read-more-btn">
    {{ isExpanded ? 'Read less' : 'Read more' }}
  </button>
  <div class="reviewer-info">
    <div class="name">- {{ name }}</div>
    <div class="rating">
      <span v-for="star in rating" :key="star" class="star">★</span>
    </div>
  </div>
</div>
</template>

<style scoped lang="scss">
@import "../../assets/Colors";
@import "../../assets/Text";

.card {
  border-radius: 20px;
  padding: 1.5rem;
  width: 70%;
  justify-self: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-right: 1rem;
  text-align: center;
}

.review-text-container {
  position: relative;
  overflow: hidden;
  transition: max-height 1s ease-in-out;
  max-height: 1000px; /* A value larger than any expected text height */

  &.collapsed {
    max-height: 250px; /* Approximate height for 3 lines of text */
  }
}

.review-text {
  font-size: $fontNormal;
  font-family: "Comfortaa", sans-serif;
  margin-top: 0;
  margin-bottom: 1rem;
  font-weight: 500;
  line-height: 1.4;
}

.collapsed .review-text {
  display: -webkit-box;
  -webkit-line-clamp: 5; /* Show approximately 3 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: max-height 1s ease-in-out;
}

.read-more-btn {
  background: none;
  border: none;
  color: $primary;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 1rem;
  padding: 0;
  text-decoration: underline;
  font-family: "Comfortaa", sans-serif;
  font-size: 0.9rem;
}

.reviewer-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.name {
  width: 100%;
  text-align: center;
  font-weight: 600;
  font-size: $fontMed;
  margin-bottom: 0.5rem;
}

.rating {
  color: $primary;
  font-size: 1.2rem;
}

.star {
  margin-right: 2px;
}

@media (max-width: 480px) {
  .card {
    width: 85%;
  }
}
</style>
