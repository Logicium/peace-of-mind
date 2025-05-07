<script setup lang="ts">
defineProps<{
  text: string;
  name: string;
  rating: number;
}>();
</script>

<template>
<div class="card">
  <h2 class="review-text">"{{ text }}"</h2>
  <div class="reviewer-info">
    <div class="name">{{ name }}</div>
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
  background-color: $bg2;
  border-radius: 20px;
  padding: 1.5rem;
  min-width: 300px;
  max-width: 350px;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-right: 1rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.review-text {
  font-size: $fontNormal;
  margin-top: 0;
  margin-bottom: 1rem;
  font-weight: 500;
  line-height: 1.4;
}

.reviewer-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.rating {
  color: $primary;
  font-size: 1.2rem;
}

.star {
  margin-right: 2px;
}
</style>
