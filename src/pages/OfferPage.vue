<script setup lang="ts">
import serviceDetails from "../data/serviceDetails.ts";
import RoseArt from "@/assets/line-art/RoseArt.vue";
import LilyArt from "@/assets/line-art/LilyArt.vue";
import LotusArt from "@/assets/line-art/LotusArt.vue";
import CarnationArt from "@/assets/line-art/CarnationArt.vue";
import ServicesSectionPanel from "@/components/cards/ServicesSectionPanel.vue";
</script>

<template>
  <div class="offerPage">


    <!-- Childbirth Education Section -->
    <ServicesSectionPanel
      :title="serviceDetails.childbirth.title"
      :tagline="serviceDetails.childbirth.tagline"
      :includes="serviceDetails.childbirth.includes"
      :price="serviceDetails.childbirth.price"
      imageUrl="/images/insta/IMG_0185.heic"
      imageAlt="Childbirth Education"
      hasHeaderSection
    >
      <template #flowerArt>
        <RoseArt />
      </template>
    </ServicesSectionPanel>

    <!-- Birth Doula Support Section -->
    <ServicesSectionPanel
      :title="serviceDetails.doula.title"
      :tagline="serviceDetails.doula.tagline"
      :description="serviceDetails.doula.fullDesc"
      :includes="serviceDetails.doula.includes"
      :price="serviceDetails.doula.price"
      :detailsOnRight="false"
      :altBackground="true"
      imageUrl="/images/insta/IMG_0379.heic"
      imageAlt="Birth Doula Support"
    >
      <template #flowerArt>
        <LilyArt />
      </template>
    </ServicesSectionPanel>

    <!-- Birth Plan Support Section -->
    <ServicesSectionPanel
      :title="serviceDetails.birthPlan.title"
      :tagline="serviceDetails.birthPlan.tagline"
      :description="serviceDetails.birthPlan.fullDesc"
      :includes="serviceDetails.birthPlan.includes"
      :price="serviceDetails.birthPlan.price"
      imageUrl="/images/insta/IMG_0473.heic"
      imageAlt="Birth Plan Support"
    >
      <template #flowerArt>
        <CarnationArt />
      </template>
    </ServicesSectionPanel>

    <!-- Car Seat Safety Section -->
    <ServicesSectionPanel
      :title="serviceDetails.carSeat.title"
      :description="serviceDetails.carSeat.fullDesc"
      :includes="serviceDetails.carSeat.includes"
      :price="serviceDetails.carSeat.price"
      :detailsOnRight="false"
      :altBackground="true"
      imageUrl="/images/carseat/seat3.JPEG"
      imageAlt="Car Seat Safety"
    >
      <template #flowerArt>
        <LotusArt />
      </template>
    </ServicesSectionPanel>

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
  max-width: 1200px;
  margin: 0 auto;
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
  .slidingScaleContent {
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
