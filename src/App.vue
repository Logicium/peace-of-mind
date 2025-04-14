<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import Navbar from "@/components/Navbar.vue";
</script>

<template>
 <div class="app">

 </div>
  <Navbar/>
  <RouterView />
  <div class="footer"></div>

</template>

<style scoped lang="scss">

</style>
