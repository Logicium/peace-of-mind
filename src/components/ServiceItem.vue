<script setup lang="ts">

import {computed} from "vue";

const props = defineProps(['image','name','desc']);
const imageUrl = computed(()=> 'url("'+props.image+'")').value;

</script>

<template>
  <div class="serviceItem">
    <div class="flex">
      <div class="serviceImg"></div>
      <div class="serviceName top">{{name}}</div>
    </div>
    <div class="serviceDesc">{{desc}}</div>
    <RouterLink to="/offer"><div class="btn underline">Learn More</div></RouterLink>
  </div>
</template>

<style lang="scss" scoped>

@import "../assets/Colors";
@import "../assets/Text";

.serviceItem{
  display: flex;
  flex-direction: column;
  text-align: center;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.serviceName{
  font-size: $fontBig;
}

.serviceImg{
  aspect-ratio: 1/1;
  border-radius: 50%;
  background-image: v-bind(imageUrl);
  background-size: cover;
  background-position: 100% 100%;
  min-width:100%;
  margin-bottom: 1vw;
}

.top{
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

.flex{
  display: flex;
  flex-direction: column;
  width: 80%;
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

a {
  text-decoration: none;
  color: inherit;
}

</style>
