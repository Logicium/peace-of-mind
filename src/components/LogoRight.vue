<script setup lang="ts">

import data from "@/data/data.ts";
</script>

<template>
  <div class="logoWrap">
    <div class="logo"/>
    <div class="logoInfo">
      <div class="title">Peace of Mind</div>
      <div class="subtitle">{{'Birth Education Llc'.toUpperCase()}}</div>
      <div class="subtitle">{{data.about.subtitle}}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">


.logo {
  background-image: url('/images/logo.png');
  background-size: cover;
  background-position: 100% 100%;
  height: 120px;
  width: 120px;
  margin-right: 1rem;
}

.logoWrap {
  padding-top: 1rem;
  display: flex;
  padding-left: 1rem;
}


</style>
