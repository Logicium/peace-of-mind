<script setup lang="ts">
import serviceDetails from "../data/serviceDetails.ts";
import FlowerArt1 from "@/assets/line-art/FlowerArt1.vue";
import FlowerArt2 from "@/assets/line-art/FlowerArt2.vue";
import FlowerArt3 from "@/assets/line-art/FlowerArt3.vue";
import RoseArt from "@/assets/line-art/RoseArt.vue";
import LilyArt from "@/assets/line-art/LilyArt.vue";
import LotusArt from "@/assets/line-art/LotusArt.vue";
</script>

<template>
  <div class="offerPage">
    <div class="headerSection">
      <div class="banner">What I Offer</div>
      <div class="decorElement"><FlowerArt3/></div>
    </div>

    <!-- Childbirth Education Section -->
    <div class="serviceSection">
      <div class="serviceHeader">
        <h2 class="serviceTitle">{{ serviceDetails.childbirth.title }}</h2>
        <div class="serviceTagline">{{ serviceDetails.childbirth.tagline }}</div>
      </div>

      <div class="serviceContent">
        <div class="serviceDetails">
          <h3 class="includesTitle">What's Included:</h3>
          <ul class="includesList">
            <li v-for="(item, index) in serviceDetails.childbirth.includes" :key="index" class="includesItem">
              {{ item }}
            </li>
          </ul>
          <div class="servicePrice">{{ serviceDetails.childbirth.price }}</div>
        </div>
        <div class="serviceDecor">
          <RoseArt />
        </div>
      </div>
    </div>

    <!-- Birth Doula Support Section -->
    <div class="serviceSection altBackground">
      <div class="serviceHeader">
        <h2 class="serviceTitle">{{ serviceDetails.doula.title }}</h2>
        <div class="serviceTaglines">
          <div class="serviceTagline" v-for="(tagline, index) in serviceDetails.doula.tagline" :key="index">
            {{ tagline }}
          </div>
        </div>
      </div>

      <div class="serviceDescription">{{ serviceDetails.doula.fullDesc }}</div>

      <div class="serviceContent">
        <div class="serviceDecor">
          <LilyArt />
        </div>
        <div class="serviceDetails">
          <h3 class="includesTitle">What's Included:</h3>
          <ul class="includesList">
            <li v-for="(item, index) in serviceDetails.doula.includes" :key="index" class="includesItem">
              {{ item }}
            </li>
          </ul>
          <div class="servicePrice">{{ serviceDetails.doula.price }}</div>
        </div>
      </div>
    </div>

    <!-- Car Seat Safety Section -->
    <div class="serviceSection">
      <div class="serviceHeader">
        <h2 class="serviceTitle">{{ serviceDetails.carSeat.title }}</h2>
      </div>

      <div class="serviceDescription">{{ serviceDetails.carSeat.fullDesc }}</div>

      <div class="serviceContent">
        <div class="serviceDetails">
          <h3 class="includesTitle">What's Included:</h3>
          <ul class="includesList">
            <li v-for="(item, index) in serviceDetails.carSeat.includes" :key="index" class="includesItem">
              {{ item }}
            </li>
          </ul>
          <div class="servicePrice">{{ serviceDetails.carSeat.price }}</div>
        </div>
        <div class="serviceDecor">
          <LotusArt />
        </div>
      </div>
    </div>

    <!-- Sliding Scale Section -->
    <div class="slidingScaleSection">
      <div class="slidingScaleContent">
        <div class="slidingScaleText">{{ serviceDetails.slidingScale }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/Text";
@import "../assets/Colors";

.offerPage {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
  padding: 0 24px;
}

.headerSection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 100px 0 50px;
  position: relative;
}

.decorElement {
  position: absolute;
  width: 250px;
  height: 250px;
  right: 5%;
  top: 20%;
  color: $primary;
}

.decorElement2 {
  position: absolute;
  width: 150px;
  height: 150px;
  bottom: 10%;
  right: 10%;
  color: $primary;
}

.serviceSection {
  margin-bottom: $paddingLg;
  padding: $paddingLg;
  border-radius: 24px;
  position: relative;
}

.altBackground {
  background-color: $secondary;
}

.serviceHeader {
  margin-bottom: $paddingMd;
  text-align: center;
}

.serviceTitle {
  font-size: $fontBig;
  font-family: "Newsreader", serif;
  margin-bottom: $paddingSm;
  color: $primary;
}

.serviceTagline {
  font-size: $fontNormal;
  font-weight: 500;
  margin-bottom: $paddingMd;
}

.serviceTaglines {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $paddingSm;
}

.serviceDescription {
  font-size: $fontNormal;
  line-height: 1.6;
  margin-bottom: $paddingMd;
  text-align: center;
  max-width: 80%;
  margin-left: auto;
  margin-right: auto;
}

.serviceContent {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.serviceDetails {
  flex: 1;
  padding: $paddingMd;
}

.includesTitle {
  font-size: calc($fontNormal + 2px);
  font-weight: 500;
  margin-bottom: $paddingMd;
  color: $primary;
}

.includesList {
  list-style-type: none;
  padding: 0;
  margin-bottom: $paddingMd;
}

.includesItem {
  margin-bottom: $paddingSm;
  padding-left: 20px;
  position: relative;
  line-height: 1.6;

  &:before {
    content: "•";
    position: absolute;
    left: 0;
    color: $primary;
  }
}

.servicePrice {
  font-weight: 500;
  font-size: calc($fontNormal + 2px);
  margin-top: $paddingMd;
  color: $primary;
}

.serviceDecor {
  width: 200px;
  height: 200px;
  color: $primary;
  margin: 0 $paddingMd;
}

.slidingScaleSection {
  margin: $paddingLg 0;
  padding: $paddingLg;
  background-color: $secondary;
  border-radius: 24px;
  position: relative;
}

.slidingScaleContent {
  position: relative;
  max-width: 80%;
  margin: 0 auto;
}

.slidingScaleText {
  font-size: $fontNormal;
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 768px) {
  .serviceContent {
    flex-direction: column;
  }

  .serviceDecor {
    margin: $paddingMd 0;
  }

  .serviceDescription, .slidingScaleContent {
    max-width: 100%;
  }

  .decorElement, .decorElement2 {
    display: none;
  }
}
</style>
