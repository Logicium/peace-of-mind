<script setup lang="ts">

import {computed} from "vue";

const props = defineProps(['image','name','desc']);
const imageUrl = computed(()=> 'url("'+props.image+'")').value;

</script>

<template>
  <div class="serviceItem">
    <div class="serviceImg"></div>
    <div class="serviceName">{{name}}</div>
    <div class="serviceDesc">{{desc}}</div>
    <div class="btn oval">Learn More</div>
  </div>
</template>

<style lang="scss" scoped>

@import "../assets/Colors";

.serviceItem{
  display: flex;
  flex-direction: column;
  text-align: center;
  align-items: center;
  height: 100%;
}

.serviceName{
  font-size: calc(12px + 1vw);
}

.serviceImg{
  aspect-ratio: 1/1;
  border-radius: 50%;
  background-image: v-bind(imageUrl);
  background-size: cover;
  background-position: 100% 100%;
  width: 50%;
  margin-bottom: 1vw;
}

.btn {
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: $primary;
  color: $background;
  box-sizing: border-box;
  padding: 1vw;
  margin-top: auto;
  cursor: pointer;
}

.serviceDesc{
  margin-bottom: 1vw;
}

.underline{
  color: $primary;
  background-color: transparent;
  border-bottom: 4px solid $primary;
  width: fit-content;
}

.oval{
  height: 45px;
  border-radius: 45px;
  width: fit-content;
}

</style>
