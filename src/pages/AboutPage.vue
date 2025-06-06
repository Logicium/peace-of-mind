<script setup lang="ts">
import data from "../data/data.ts";
import FlowerArt1 from "@/assets/line-art/FlowerArt1.vue";
import FlowerArt2 from "@/assets/line-art/FlowerArt2.vue";
import LilyArt from "@/assets/line-art/LilyArt.vue";
import RoseArt from "@/assets/line-art/RoseArt.vue";
import FlowerCard from "@/components/cards/FlowerCard.vue";
</script>

<template>
  <div class="about">
    <div class="panel">
      <div class="infoArea">
        <div class="banner">About Peace of Mind</div>
        <div class="aboutText">{{ data.about.intro }}</div>
      </div>
      <div class="imageArea">
        <div class="aboutImage"></div>
      </div>
      <FlowerCard
        size="big"
        :position="{ bottom: '0%', left: '15%' }"
        :zIndex="1"
      >
        <FlowerArt1/>
      </FlowerCard>
    </div>

    <div class="panelFull">

      <div class="bioSection">
        <div class="sectionTitle">My Mission</div>
        <div class="bioText">{{ data.about.introShort }}</div>
      </div>

      <div class="certSection">
        <div class="sectionTitle">Certifications</div>
        <div class="certList">
          <div class="certItem" v-for="(cert, index) in data.certs" :key="index">
            <div class="certIcon"><RoseArt /></div>
            <div class="certName">{{ cert }}</div>
          </div>
        </div>
      </div>

      <div class="membershipSection">
        <div class="sectionTitle">Professional Memberships</div>
        <div class="membershipList">
          <div class="membershipItem" v-for="(membership, index) in data.memberships" :key="index">
            <div class="membershipIcon"><LilyArt /></div>
            <div class="membershipName">{{ membership }}</div>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/Text";
@import "../assets/Colors";

.about {
  display: flex;
  flex-direction: column;
}

.panel, .panelFull {
  position: relative;
  display: grid;
  height: calc(100vh - 200px);
  grid-template-columns: 1fr 1fr;
  padding: 100px 24px 100px 24px;
  overflow: hidden;
}

.panelFull {
  min-height: calc(100vh - 100px);
  height: auto;
  display: flex;
  flex-direction: column;
  padding-top: 0;
  padding-bottom: $paddingMd;
  background-color: $background;
}

.infoArea {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.aboutText {
  width: 80%;
  margin-top: $paddingMd;
  font-size: $fontNormal;
  line-height: 1.6;
}

.imageArea {
  position: relative;
  z-index: 1;
  margin-top: $paddingXl;
}

.aboutImage {
  border-radius: 50%;
  aspect-ratio: 1/1;
  margin-top: 100px;
  width: 100%;
  max-width: calc(50vw - 50px);
  right: 0;
  background-position: center;
  background-image: url("/images/kisori/kisori3.heic");
  background-size: cover;
  position: relative;
}

@media (max-width: 768px) {
  .panel {
    grid-template-columns: 1fr;
    height: auto;
  }

  .aboutImage {
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .infoArea {
    order: 1;
    text-align: center;
    align-items: center;
  }

  .aboutText, .banner {
    width: 100%;
  }
}

// Flower styles now handled by FlowerCard component

.bgCircle {
  position: absolute;
  background-color: $secondary;
  border-top-right-radius: 50%;
  border-bottom-right-radius: 50%;
  aspect-ratio: 1/1;
  margin-top: 100px;
  min-height: calc(100% - 200px);
  max-height: calc(100% - 200px);
  transform: translateX(-25%);
  z-index: 0;
}

.sectionTitle {
  font-size: $fontBig;
  font-family: "Comfortaa", sans-serif;
  margin-bottom: $paddingMd;
  color: $primary;
  text-align: center;
}

.certSection, .membershipSection, .bioSection {
  margin-bottom: $paddingLg;
  padding: $paddingMd;
  position: relative;
}

.certList, .membershipList {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $paddingMd;
}

.certItem, .membershipItem {
  display: flex;
  align-items: center;
  background-color: $secondary;
  padding: $paddingMd;
  border-radius: 24px;
}

.certIcon, .membershipIcon {
  width: 50px;
  min-width: 50px;
  min-height: 50px;
  height: 50px;
  margin-right: $paddingSm;
  color: $primary;
}

.certName, .membershipName {
  font-size: 20px;
  font-weight: 500;
  font-family: "Comfortaa", sans-serif;
}

.bioText {
  font-size: $fontNormal;
  line-height: 1.6;
  max-width: 80%;
  margin: 0 auto;
  text-align: center;
}
</style>
