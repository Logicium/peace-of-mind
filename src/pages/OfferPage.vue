<script setup lang="ts">
import serviceDetails from "../data/serviceDetails.ts";
import RoseArt from "@/assets/line-art/RoseArt.vue";
import LilyArt from "@/assets/line-art/LilyArt.vue";
import LotusArt from "@/assets/line-art/LotusArt.vue";
import CarnationArt from "@/assets/line-art/CarnationArt.vue";
</script>

<template>
  <div class="offerPage">


    <!-- Childbirth Education Section -->
    <div class="serviceSection">
      <div class="headerSection">
        <div class="banner">What I Offer</div>
      </div>
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
          <div class="servicePrice" v-html="serviceDetails.childbirth.price"></div>
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
          <div class="servicePrice" v-html="serviceDetails.doula.price"></div>
        </div>
      </div>
    </div>

    <!-- Birth Plan Support Section -->
    <div class="serviceSection">
      <div class="serviceHeader">
        <h2 class="serviceTitle">{{ serviceDetails.birthPlan.title }}</h2>
        <div class="serviceTagline">{{ serviceDetails.birthPlan.tagline }}</div>
      </div>

      <div class="serviceDescription">{{ serviceDetails.birthPlan.fullDesc }}</div>

      <div class="serviceContent">
        <div class="serviceDetails">
          <h3 class="includesTitle">What's Included:</h3>
          <ul class="includesList">
            <li v-for="(item, index) in serviceDetails.birthPlan.includes" :key="index" class="includesItem">
              {{ item }}
            </li>
          </ul>
          <div class="servicePrice" v-html="serviceDetails.birthPlan.price"></div>
        </div>
        <div class="serviceDecor">
          <CarnationArt />
        </div>
      </div>
    </div>

    <!-- Car Seat Safety Section -->
    <div class="serviceSection altBackground">
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
          <div class="servicePrice" v-html="serviceDetails.carSeat.price"></div>
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
        <RouterLink to="/contact"><div class="btn oval">LET'S CONNECT</div></RouterLink>
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
  position: relative;
  display: flex;
  justify-content: center;
  text-align: center;
  margin-top: 200px;
  padding: 50px 0 50px;
  background-color: $secondary;
  border-radius: 24px;
}

.background{
  position: absolute;
  background-color: $background;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
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
  position: relative;
  margin-bottom: $paddingLg;
  padding: $paddingLg;
  border-radius: 24px;
  background-color: $background;
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
  text-decoration: underline;
  font-family: "Comfortaa", sans-serif;
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
  background-color: #d0baf7;
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

.btn{
  margin-top: $paddingMd;
  justify-self: center;
}
</style>
