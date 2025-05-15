<script setup lang="ts">

import LogoCenter from "@/components/LogoCenter.vue";
</script>

<template>
  <div class="titleBar">

    <LogoCenter/>

    <div class="nav">
      <!--          <div class="navBtn btn oval">Book Consultation</div>-->
      <RouterLink to="/about"><div class="navItem">About</div></RouterLink>
      <RouterLink to="/offer"><div class="navItem">What I Offer</div></RouterLink>
      <RouterLink to="/contact"><div class="navItem">Contact</div></RouterLink>
      <div class="navItem">Resources</div>
    </div>

  </div>
</template>

<style scoped lang="scss">

@import "../assets/Colors.scss";

.titleBar {
  display: grid;
  width: 100%;
}

.nav {
  padding-top: 1rem;
  display: flex;
  text-align: right;
  justify-content: center;
  color: $primary;
}

.navItem {
  font-weight: 900;
  margin-right: 2vw;
  margin-top: 1vw;
  cursor: pointer;
}

a{
  text-decoration: none;
  color: $primary;
}

</style>
