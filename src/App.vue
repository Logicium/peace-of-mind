<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import Navbar from "@/components/Navbar.vue";
import Navalt from "@/components/Navalt.vue";
</script>

<template>
 <div class="app">
   <Navalt/>
   <RouterView />
   <div class="footer"></div>
 </div>
</template>

<style scoped lang="scss">

.app{
  position: relative;
}

</style>
