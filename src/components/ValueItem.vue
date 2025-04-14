<script setup lang="ts">

import {computed} from "vue";

const props = defineProps({
  data: { type: Object, default: ()=>{}},
})

const imageUrl = computed(()=> 'url("'+props.data.image+'")').value;

</script>

<template>


    <div class="hookGrid">

      <div class="imgWrap">

        <div class="hookItem">
          <div class="circle"/>
          <div class="hook">"{{data.hook}}"</div>
        </div>

      </div>

      <div class="desc">
        <div class="hookImage"></div>
        <div>{{data.desc}}</div>
      </div>


    </div>


</template>

<style scoped lang="scss">

@import "../assets/Text";
@import "../assets/Colors";

.hook{
  font-weight: 700;
  font-size: $fontMed;
  z-index: 1;
  position: relative;
  text-align: center;
}

.hookItem{
  padding: 2rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: end;
}

.hookGrid{
  display: grid;
  position: relative;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 2rem;
  width: 100%;
  height: 100%;
  margin-bottom: 2rem;
}

.hookImage{
  height: 70%;
  width: 100%;
  border-radius: 24px;
  background-image: v-bind(imageUrl);
  background-position: 100% 10%;
  background-size: cover;
}

.desc{
  white-space: break-spaces;
  display: block;
}

.imgInfo{

}

.imgWrap{
  width: 100%;
  position: relative;
}

.circle{
  position: absolute;
  justify-self: center;
  aspect-ratio: 1/1;
  width: 50%;
  border-radius: 50%;
  background-color: $quat;
}

.valueItem{
  width: 100%;
}


</style>
