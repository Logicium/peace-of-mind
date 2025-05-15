<script setup lang="ts">
import data from "../data/data.ts";
import FlowerArt1 from "@/assets/line-art/FlowerArt1.vue";
import FlowerArt2 from "@/assets/line-art/FlowerArt2.vue";
import LilyArt from "@/assets/line-art/LilyArt.vue";
import RoseArt from "@/assets/line-art/RoseArt.vue";
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
      <div class="flowerDecor"><FlowerArt1/></div>
      <div class="bgCircle"></div>
    </div>

    <div class="panelFull">
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

      <div class="bioSection">
        <div class="sectionTitle">My Mission</div>
        <div class="bioText">{{ data.about.introShort }}</div>
        <div class="flowerDecor2"><FlowerArt2/></div>
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
}

.aboutImage {
  position: absolute;
  border-radius: 50%;
  aspect-ratio: 1/1;
  margin-top: 100px;
  min-height: calc(100% - 200px);
  max-height: calc(100% - 200px);
  right: 0;
  transform: translateX(25%);
  background-position: center;
  background-image: url("/images/pregnancy/pregnancy3.jpg");
  background-size: cover;
}

.flowerDecor {
  position: absolute;
  width: 200px;
  height: 200px;
  bottom: 10%;
  left: 15%;
  color: $primary;
  z-index: 1;
}

.flowerDecor2 {
  position: absolute;
  width: 150px;
  height: 150px;
  bottom: 5%;
  right: 10%;
  color: $primary;
  z-index: 1;
}

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
  font-family: "Newsreader", serif;
  margin-bottom: $paddingMd;
  color: $primary;
}

.certSection, .membershipSection, .bioSection {
  margin-bottom: $paddingLg;
  padding: $paddingMd;
  position: relative;
}

.certList, .membershipList {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  height: 50px;
  margin-right: $paddingSm;
  color: $primary;
}

.certName, .membershipName {
  font-size: $fontNormal;
  font-weight: 500;
}

.bioText {
  font-size: $fontNormal;
  line-height: 1.6;
  max-width: 80%;
  margin: 0 auto;
  text-align: center;
}
</style>
