<script setup lang="ts">

import ValueItem from "@/components/ValueItem.vue";
import data from "@/data/data.ts";

</script>

<template>
  <div class="section">
    <div class="values">
      <ValueItem v-for="value in data.research" :data="value"/>
    </div>
  </div>
</template>

<style scoped lang="scss">

@import "../assets/Colors";

.section{
  display: flex;
  background-color: $secondary;
  border-radius: 24px;
}

.values{
  display: grid;
  grid-template-rows: auto;
  grid-gap: 2rem;
}

</style>
