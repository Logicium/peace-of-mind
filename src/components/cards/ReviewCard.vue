<script setup lang="ts">
defineProps<{
  text: string;
  name: string;
  rating?: number;
}>();
</script>

<template>
<div class="card">
  <h2 class="review-text" v-html="''+text"></h2>
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

.review-text {
  font-size: $fontNormal;
  font-family: "Comfortaa", sans-serif;
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
</style>
