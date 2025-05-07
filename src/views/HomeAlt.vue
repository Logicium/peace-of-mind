<script setup lang="ts">

import data from "../data/data.ts";
import FlowerArt1 from "@/assets/line-art/FlowerArt1.vue";
import FlowerArt2 from "@/assets/line-art/FlowerArt2.vue";
import FlowerArt3 from "@/assets/line-art/FlowerArt3.vue";
import ServiceItem from "@/components/ServiceItem.vue";
import ReviewCard from "@/components/cards/ReviewCard.vue";
</script>

<template>
  <div class="home">
    <div class="panel">

      <div class="infoArea">
        <div class="top">{{data.about.subtitle.toUpperCase()}}</div>
        <div class="banner">{{data.about.tagline}}</div>
        <div class="btn oval">LEARN MORE</div>
      </div>
      <div class="flowerBg"><FlowerArt3/></div>
      <div class="flowerSm"><FlowerArt2/></div>
      <div class="imageArea">

      </div>
      <div class="image">
        <div class="flowerMd"><FlowerArt1/></div>
      </div>
      <div class="bgCircle"/>

    </div>
    <div class="panel about">
      <div></div>
      <div class="infoAreaRev">
        <div class="banner top">Hi, I'm Kisori!</div>
        <div class="bio normal">{{data.about.bioShort}}</div>
        <div class="btn oval">LEARN MORE</div>
      </div>
      <div class="image2">

      </div>
      <div class="bgCircle2">

      </div>
    </div>
    <div class="panelFull offers">
      <div class="reviews-title banner">My Services</div>
      <div class="offersWrap">
        <ServiceItem v-for="(service, index) in data.services"
                     :name="service.name"
                     :desc="service.desc"
                     :image="service.image"
                     :key="index"
        />
      </div>
      <div class="reviews-container">
        <h3 class="reviews-title">What Our Clients Say</h3>
        <div class="reviews">
          <ReviewCard
            v-for="(review, index) in data.reviews"
            :key="index"
            :text="review.text"
            :name="review.name"
            :rating="review.rating"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

@import "../assets/Text";
@import "../assets/Colors";

.panel,.panelFull{
  position: relative;
  display: grid;
  height: calc(100vh - 200px);
  grid-template-columns: 1fr 1fr;
  padding:100px 24px 100px 24px;
  overflow: hidden;
}

.panelFull{
  min-height: calc(100vh - 100px);
  height: auto;
  padding-top: 0;
  padding-bottom: $paddingMd;
}

.banner{
  width: 80%;
}

.normal{
  font-size: $fontNormal;
}

.about{
  background-color: $background;
}
.offersWrap{
  background-color: $secondary;
  border-radius: 45px;
  display: grid;
  grid-template-columns: repeat(3,1fr);
  grid-gap: 2rem;
  padding:2rem;
}

.flowerSm{
  position: absolute;
  width: 150px;
  height: 150px;
  bottom: 0;
  right: 5%;
  color: $primary;
  transform: rotate(-90deg);
}

.flowerMd{
  position: absolute;
  width: 250px;
  height: 250px;
  top: 10%;
  left: -5%;
  color: $primary;
}

.flowerBg{
  position: absolute;
  width: 300px;
  height: 300px;
  color: $primary;
  bottom: 0;
  left: 10%;
  transform: rotate(170deg);
  z-index: 1;
}

.list{
  .button{
    margin-left: auto;
  }
}

.logo{
  margin-bottom: $paddingLg;
}

.offers{
  background-color: $background;
  grid-template-rows: 1fr auto;
  grid-template-columns: 1fr;
}

.bio{
  width: 80%;
}

.bgCircle,.bgCircle2{
  position: absolute;
  background-color: $secondary;
  //border-radius: 50%;
  border-top-right-radius: 50%;
  border-bottom-right-radius: 50%;
  aspect-ratio: 1/1;
  margin-top: 100px;
  min-height: calc(100% - 200px);
  max-height: calc(100% - 200px);
  transform: translateX(-25%);
  z-index: 0;
}

.bgCircle2{
  border-radius: 0;
  border-top-left-radius: 50%;
  border-bottom-left-radius: 50%;
  right:0;
  background-color: $bg2;
  transform: translateX(25%);
}

.big{
  font-size: $fontBig;
}

.btn{
  margin-top: $paddingLg;
}

.top{
  margin-bottom: $paddingLg;
}

.infoArea{
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.imageArea{
  position: relative;
  z-index: 1;
  margin-right: -100px;
}

.image{
  //border-top-left-radius: 50%;
  //border-bottom-left-radius: 50%;
  position: absolute;
  border-radius: 50%;
  aspect-ratio: 1/1;
  margin-top: 100px;
  min-height: calc(100% - 200px);
  max-height: calc(100% - 200px);
  //height: 100%;
  //width: 100%;
  right: 0;
  transform: translateX(25%);
  background-position: 80% center;
  background-image: url("/images/pregnancy/pregnancy1.jpg");
}

.image2{
  position: absolute;
  border-radius: 50%;
  aspect-ratio: 1/1;
  margin-top: 100px;
  min-height: calc(100% - 200px);
  max-height: calc(100% - 200px);
  left: 0;
  transform: translateX(-25%);
  background-position: center;
  background-image: url("/images/kisori/kisori.jpg");
  background-size: cover;
}

.infoAreaRev{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  text-align: right;
  position: relative;
  z-index: 1;
}

.reviews-container {
  margin-top: 2rem;
  width: 100%;
  overflow: hidden;
}

.reviews-title {
  margin-bottom: 1.5rem;
  font-weight: 500;
  font-size: $fontBig;
}

.reviews {
  display: flex;
  border-radius: 20px;
  overflow-x: scroll;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.reviews::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
</style>
