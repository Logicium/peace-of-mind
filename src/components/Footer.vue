<script setup lang="ts">

</script>

<template>
  <div class="card"></div>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.card{
  background-color: $background;
  max-height: calc(100px - (2*$paddingMd));
  padding: $paddingMd;
}
</style>
