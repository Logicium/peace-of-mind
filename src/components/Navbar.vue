<script setup lang="ts">

import data from "@/data/data.ts";
</script>

<template>
  <div class="titleBar">

    <div class="logoWrap">
      <div class="logo"/>
      <div class="logoInfo">
        <div class="title">Peace of Mind</div>
        <div class="subtitle">{{'Birth Education Llc'.toUpperCase()}}</div>
        <div class="subtitle">{{data.about.subtitle}}</div>
      </div>

    </div>

    <div class="nav">
      <!--          <div class="navBtn btn oval">Book Consultation</div>-->
      <RouterLink to="/about"><div class="navItem">About</div></RouterLink>
      <div class="navItem">Services</div>
      <div class="navItem">Contact</div>
      <div class="navItem">Resources</div>
    </div>

  </div>
</template>

<style scoped lang="scss">

@import "../assets/Colors.scss";

.titleBar {
  display: grid;
  width: 100%;
  grid-template-columns: 2fr 1fr;
}

.title {
  font-family: "Pattaya", sans-serif;
  font-size: calc(12px + 2vw);
  color: $primary;
}

.subtitle {
  font-family: "Comfortaa", sans-serif;
  font-weight: 700;
  color: $primary;
}

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

.nav {
  padding-top: 1rem;
  display: flex;
  text-align: right;
  flex-direction: column;
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
