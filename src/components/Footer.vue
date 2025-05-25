<script setup lang="ts">
import data from '../data/data';
import InstaCard from './cards/InstaCard.vue';
const instagramPosts = data.instagramPosts;
</script>

<template>
  <div class="footer">

      <div class="image badge"/>
      <div class="links">
        <RouterLink to="/">HOME</RouterLink>
        <RouterLink to="/">ABOUT</RouterLink>
        <RouterLink to="/">WHAT I OFFER</RouterLink>
        <RouterLink to="/">CONTACT</RouterLink>
        <RouterLink to="/">FACEBOOK</RouterLink>
        <RouterLink to="/">INSTAGRAM</RouterLink>
      </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.footer{
  background-color: $secondary;
  max-height: calc(200px - (2*$paddingMd));
  padding: $paddingMd;
  display: flex;
  justify-content: space-between;
  grid-gap: $paddingMd;
}

.badge{
  background-image: url('/images/badge.png');
  height: 100px;
  width: 100px;
}

.links{
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-height: calc(100px);
  flex-wrap: wrap;
  gap: 1rem;
}

.instaWrap {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
}

a{
  color: $primary;
  width: fit-content;
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: border-bottom 0.5s;
  height: fit-content;
  &:hover{
    border-bottom: 2px solid $primary;
  }
}


</style>
