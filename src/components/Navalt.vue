<script setup lang="ts">
import {ref, onMounted} from "vue";
import data from "@/data/data.ts";

const showFull = ref(true);

// Function to handle scroll events
const handleScroll = () => {
  showFull.value = window.scrollY <= 0;
};

// Set up scroll event listener when component is mounted
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

</script>

<template>
  <nav>
    <div class="links">
      <RouterLink to="/">HOME</RouterLink>
      <RouterLink to="/about">ABOUT</RouterLink>
      <RouterLink to="/offer">WHAT I OFFER</RouterLink>
    </div>
    <div class="titleWrap">
      <div class="title" :class="{hidden:!showFull}">
        <div class="logo"/>
        <div>Peace of Mind</div>
        <div class="normal top">BIRTH EDUCATION LLC</div>
        <div class="normal small">{{data.about.subtitle}}</div>
      </div>
      <div class="title" :class="{hidden:showFull}">
        <div class="neg">Peace of Mind</div>
        <div class="normal top">BIRTH EDUCATION LLC</div>
        <div class="normal small">{{data.about.subtitle}}</div>
      </div>
    </div>
    <div class="cta">
      <RouterLink to="/contact" class="contact"><div class="btn oval">CONTACT</div></RouterLink>
    </div>
  </nav>
</template>

<style scoped lang="scss">

@import "../assets/Colors.scss";
@import "../assets/Text.scss";

nav{
  position: fixed;
  width: calc(100% - (2*$paddingMd));
  max-height: calc(100px - (2*$paddingMd));
  padding: $paddingMd;
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  z-index: 2;
  background-color: $background;
}

.top{
  margin-bottom: $paddingXs;
}

.small{
  font-size: $fontSm !important;
}

.neg{
  line-height: calc($fontBig + $fontSm);
}

.links{
  display: flex;
  justify-content: space-between;
  max-height: calc(100px - (2*$paddingMd));
  align-items: center;
  gap: $paddingMd;
}

.titleWrap{
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title{
  margin-top: -$paddingMd;
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: 1s;
  opacity: 1;
}
.hidden{
  visibility: hidden;
  opacity: 0;
  transition: 1s;
}

.normal{
  font-size: $fontNormal;
  font-family: "Comfortaa", sans-serif !important;
  font-weight: 700;
  text-align: center;
}

.cta{
  display: flex;
  margin-left: auto;
  max-height: calc(100px - (2*$paddingMd));
  align-items: center;
}

a{
  color: $primary;
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: border-bottom 0.5s;
  height: fit-content;
  &:hover:not(.contact){
    border-bottom: 2px solid $primary;
  }
}





</style>
