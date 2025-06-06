<script setup lang="ts">
import {ref, onMounted} from "vue";
import data from "@/data/data.ts";
import MenuIcon from "@/components/icons/MenuIcon.vue";
import CloseIcon from "@/components/icons/CloseIcon.vue";
import IconToggle from "@/components/cards/IconToggle.vue";

const showFull = ref(true);
const toggleMenu = ref(false);

// Function to handle scroll events
const handleScroll = () => {
  showFull.value = window.scrollY <= 0;
};

// Set up scroll event listener when component is mounted
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

const toggleMenuClick = function() {
  toggleMenu.value = !toggleMenu.value;
};

const resetNav = function() {
  toggleMenu.value = false;
};

</script>

<template>
  <nav>
    <div class="button menu" @click="toggleMenuClick">
      <IconToggle :is-active="toggleMenu">
        <template #inactive><MenuIcon/></template>
        <template #active><CloseIcon/></template>
      </IconToggle>
    </div>

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
        <div class="normal small mobile">{{data.about.subtitle}}</div>
      </div>
    </div>

    <div class="cta">
      <RouterLink to="/contact" class="contact"><div class="btn oval">CONTACT</div></RouterLink>
    </div>

    <transition name="fade">
      <div class="mobileLinks" v-if="toggleMenu">
        <RouterLink to="/" @click="resetNav()">HOME</RouterLink>
        <RouterLink to="/about" @click="resetNav()">ABOUT</RouterLink>
        <RouterLink to="/offer" @click="resetNav()">WHAT I OFFER</RouterLink>
        <RouterLink to="/contact" @click="resetNav()">CONTACT</RouterLink>
      </div>
    </transition>
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
  z-index: 10;
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

.button{
  height: 45px;
  width: 45px;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  border-radius: 45px;
  cursor: pointer;
  color: $primary;
  justify-content: center;
}

.menu{
  z-index: 11;
  display: none;
  background-color: $primary;
  color: white;
}

.mobileLinks{
  position: fixed;
  top: 0;
  left: 0;
  width: 70%;
  height: 100vh;
  background-color: $primary;
  padding-top: calc(100px + 2rem);
  padding-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  z-index: 10;

  a {
    color: white;
    font-size: 1.5rem;
    &:hover {
      border-bottom: 2px solid white;
    }
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  nav {
    grid-template-columns: 1fr 2fr 1fr;
  }

  .links{
    display: none;
  }

  .menu {
    display: flex;
  }
}

@media (max-width: 480px) {
  .cta,.mobile{
    display: none;
  }
}





</style>
