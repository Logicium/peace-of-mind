<script setup lang="ts">

import data from "../data/data.ts";
import FlowerArt1 from "@/assets/line-art/FlowerArt1.vue";
import ServiceItem from "@/components/ServiceItem.vue";
import ReviewCard from "@/components/cards/ReviewCard.vue";
import CarnationArt from "@/assets/line-art/CarnationArt.vue";
import LilyArt from "@/assets/line-art/LilyArt.vue";
import RoseArt from "@/assets/line-art/RoseArt.vue";
import LotusArt from "@/assets/line-art/LotusArt.vue";
import InstaCard from "@/components/cards/InstaCard.vue";
import FlowerCard from "@/components/cards/FlowerCard.vue";

</script>

<template>
  <div class="home">
    <div class="panel">

      <div class="infoArea">
        <div class="banner">{{data.about.tagline}}</div>
        <RouterLink to="/about"><div class="btn oval">LEARN MORE</div></RouterLink>
      </div>
      <FlowerCard
        size="big"
        :position="{ bottom: '10%', left: '15%' }"
        :rotation="160"
        :zIndex="1"
      >
        <RoseArt/>
      </FlowerCard>
      <FlowerCard
        size="small"
        :position="{ bottom: '5%', right: '0%' }"
        :rotation="-90"
      >
        <CarnationArt/>
      </FlowerCard>
      <div class="imageArea">
        <div class="image">
          <FlowerCard
            size="medium"
            :position="{ top: '15%', left: '0%' }"
          >
            <FlowerArt1/>
          </FlowerCard>
        </div>
      </div>

<!--      <div class="bgCircle"/>-->

    </div>
    <div class="panel about">

      <div>
        <div class="image2">

        </div>
      </div>

      <div class="infoAreaRev">
        <div class="banner top">Hi, I'm Kisori!</div>
        <div class="bio normal">{{data.about.bioShort}}</div>
        <RouterLink to="/about"><div class="btn oval">LEARN MORE</div></RouterLink>
      </div>

      <FlowerCard
        size="big"
        :position="{ bottom: '15%', right: '25%' }"
        :rotation="90"
        :zIndex="1"
      >
        <LilyArt/>
      </FlowerCard>
      <FlowerCard
        size="medium"
        :position="{ top: '10%', left: '25%' }"
        :rotation="60"
        :zIndex="0"
      >
        <LotusArt/>
      </FlowerCard>
<!--      <div class="bgCircle2">-->

<!--      </div>-->
    </div>
    <div class="panelFull offers">
      <div class="reviews-title">My Services</div>
      <div class="offersWrap">
        <ServiceItem v-for="(service, index) in data.services"
                     :name="service.name"
                     :desc="service.desc"
                     :image="service.image"
                     :key="index"
        />
      </div>
      <div class="reviews-container">
        <h3 class="reviews-title">What Families Are Saying</h3>
        <ReviewCard :text="data.reviews[0].text" name="Paige"/>
      </div>
      <div class="reviews-container">
        <h3 class="reviews-title">Gallery</h3>
        <div class="reviews">
            <InstaCard
              v-for="(post, index) in data.instagramPosts"
              :key="index"
              :image="post.image"
              :altText="post.alt"
            />

<!--          <ReviewCard-->
<!--            v-for="(review, index) in data.reviews"-->
<!--            :key="index"-->
<!--            :text="review.text"-->
<!--            :name="review.name"-->
<!--            :rating="review.rating"-->
<!--          />-->
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
  padding: 0px 24px 100px 24px;
}
.offersWrap{
  background-color: $secondary;
  border-radius: 45px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  grid-gap: 2rem;
  padding:2rem;
  justify-items: center;
}

// Flower styles now handled by FlowerCard component

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
  margin-top: $paddingXl;
}

.image{
  border-radius: 50%;
  aspect-ratio: 1/1;
  margin-top: 100px;
  width: 100%;
  max-width: calc(50vw - 50px);
  right: 0;
  background-position: 80% center;
  background-image: url("/images/pregnancy/pregnancy1.jpg");
  background-size: cover;
  position: relative;
}

.image2{
  position: relative;
  border-radius: 50%;
  aspect-ratio: 1/1;
  margin-top: 100px;
  width: 100%;
  max-width: calc(50vw - 50px);
  left: 0;
  background-position: 100% 10%;
  background-image: url("/images/kisori/kisori2.heic");
  background-size: cover;
  z-index: 1;
}

@media (max-width: 768px) {
  .panel, .panelFull {
    grid-template-columns: 1fr;
    height: auto;
  }

  .image, .image2 {
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: $paddingLg;
  }

  .infoArea, .infoAreaRev {
    order: 1;
    text-align: center !important;
    align-items: center !important;
  }

  .banner, .bio {
    width: 100%;
  }
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
  margin-top: $paddingLg;
  width: 100%;
  overflow: hidden;
  margin-bottom: $paddingLg;
}

.reviews-title {
  margin-bottom: 1.5rem;
  font-weight: 500;
  font-size: $fontBig;
  text-align: center;
}

.reviews {
  display: flex;
  gap: 2rem;
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

a {
  text-decoration: none;
  color: inherit;
}
</style>
