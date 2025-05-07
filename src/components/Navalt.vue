<script setup lang="ts">
import {ref, onMounted} from "vue";

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
      <RouterLink to="/">ABOUT</RouterLink>
      <RouterLink to="/">WHAT I OFFER</RouterLink>
    </div>
    <div class="titleWrap">
      <div class="title" :class="{hidden:!showFull}">
        <div class="logo"/>
        <div>Peace of Mind</div>
        <div class="normal">BIRTH EDUCATION LLC</div>
      </div>
      <div class="title" :class="{hidden:showFull}">
        <div>Peace of Mind</div>
        <div class="normal">BIRTH EDUCATION LLC</div>
      </div>
    </div>
    <div class="cta">
      <div class="btn oval">CONTACT</div>
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
  grid-template-columns: 1fr 2fr 1fr;
  z-index: 2;
  background-color: $background;
}

.links{
  display: flex;
  justify-content: space-between;
  max-height: calc(100px - (2*$paddingMd));
  align-items: center;
}

.titleWrap{
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title{
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
  &:hover{
    border-bottom: 2px solid $primary;
  }
}



</style>
