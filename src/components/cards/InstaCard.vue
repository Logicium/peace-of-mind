<script setup lang="ts">
defineProps<{
  image: string;
  altText: string;
}>();
</script>

<template>
  <div class="insta-card">
    <img :src="image" :alt="altText" class="insta-image" />
  </div>
</template>

<style scoped lang="scss">
@import "../../assets/Colors";
@import "../../assets/Text";

.insta-card {
  display: inline-block;
}

.insta-image {
  height: 100px;
  width: 100px;
  object-fit: cover;
  border-radius: 5px;
}

</style>
