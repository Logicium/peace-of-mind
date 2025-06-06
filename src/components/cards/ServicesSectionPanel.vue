<script setup lang="ts">
import { defineProps } from 'vue';

// Define props for the component
defineProps({
  // Service data
  title: {
    type: String,
    required: true
  },
  tagline: {
    type: [String, Array],
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  includes: {
    type: Array,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  // Layout and styling
  altBackground: {
    type: Boolean,
    default: false
  },
  detailsOnRight: {
    type: Boolean,
    default: true
  },
  // Image and decoration
  imageUrl: {
    type: String,
    required: true
  },
  imageAlt: {
    type: String,
    required: true
  },
  // Slot for the flower art component
  hasHeaderSection: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <div class="serviceSection" :class="{ altBackground }">
    <div v-if="hasHeaderSection" class="headerSection">
      <div class="banner">What I Offer</div>
    </div>

    <div class="serviceHeader">
      <h2 class="serviceTitle">{{ title }}</h2>
      <div v-if="typeof tagline === 'string' && tagline" class="serviceTagline">{{ tagline }}</div>
      <div v-else-if="Array.isArray(tagline) && tagline.length" class="serviceTaglines">
        <div class="serviceTagline" v-for="(line, index) in tagline" :key="index">
          {{ line }}
        </div>
      </div>
    </div>

    <div v-if="description" class="serviceDescription">{{ description }}</div>

    <div class="serviceContent" :class="{ 'reverse-layout': !detailsOnRight }">
      <div class="serviceDetails">
        <h3 class="includesTitle">What's Included:</h3>
        <ul class="includesList">
          <li v-for="(item, index) in includes" :key="index" class="includesItem">
            {{ item }}
          </li>
        </ul>
        <div class="servicePrice" v-html="price"></div>
      </div>
      <div class="serviceDecor">
        <div class="flowerArtContainer">
          <slot name="flowerArt"></slot>
        </div>
        <img :src="imageUrl" :alt="imageAlt" class="circularImage" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../../assets/Text";
@import "../../assets/Colors";

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

.reverse-layout {
  flex-direction: row-reverse;
}

.serviceDetails {
  flex: 2;
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
  flex: 1;
  min-width: 33.33%;
  margin: 0 $paddingMd;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.flowerArtContainer {
  position: absolute;
  width: calc(100% + 4vw);
  height: calc(100% + 4vw);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;

  :deep(svg) {
    position: absolute;
    width: calc(150px + 2vw);
    height: calc(150px + 2vw);
    color: $primary;

    &:nth-child(1) {
      top: -10% !important;
      left: 0 !important;
      transform: rotate(-30deg);
      z-index: 1;
    }

  }
}

.circularImage {
  width: 100%;
  height: auto;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: 50%;
  position: relative;
  z-index: 2;
}

@media (max-width: 768px) {
  .serviceContent {
    flex-direction: column;
  }

  .serviceDecor {
    margin: $paddingMd 0;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .flowerArtContainer {
    width: calc(100% + 2vw);
    height: calc(100% + 2vw);

    :deep(svg) {
      width: calc(100px + 2vw);
      height: calc(100px + 2vw);

      &:nth-child(1) {
        top: -5%;
        left: 5%;
      }

      &:nth-child(2) {
        bottom: -5%;
        right: 0;
      }

      &:nth-child(3) {
        top: 50%;
        left: -5%;
        transform: translateY(-50%) rotate(90deg);
      }

      &:nth-child(4) {
        top: 5%;
        right: 0;
        transform: rotate(-45deg);
      }
    }
  }

  .circularImage {
    max-width: 400px;
  }

  .serviceDescription {
    max-width: 100%;
  }
}
</style>
