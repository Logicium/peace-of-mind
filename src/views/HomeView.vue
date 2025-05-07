<script setup lang="ts">
import data from "@/data/data.ts";
import ServiceItem from "@/components/ServiceItem.vue";
import BranchArt from "@/assets/line-art/BranchArt.vue";
import ValueSection from "@/views/ValueSection.vue";

</script>

<template>
    <div class="home">

      <div class="tagline">{{data.about.tagline}}</div>

      <div class="headerGrid">

        <div class="profileCol">
          <div class="profileImage"></div>

          <div class="headerInfo">
            <div class="title2">About</div>
            <div class="intro">{{data.about.introShort}}</div>
            <div class="btn oval">Learn More</div>

          </div>

        </div>

        <div class="headerCol">
          <div class="headerImage"></div>
          <div class="art"><BranchArt/></div>
        </div>

        <div class="contactCol">
          <div class="title2">Contact</div>
          <input type="text" placeholder="First name"/>
          <input type="text" placeholder="Last name"/>
          <input type="text" placeholder="Email"/>
          <input type="number" placeholder="Phone"/>
          <input type="text" placeholder="What services are you interested in?"/>
          <input type="text" placeholder="How did you hear about me?"/>
          <div class="label">Estimated Due Date:</div>
          <input type="date" placeholder="Estimated Due Date">
          <div class="btn oval">Contact</div>
        </div>

      </div>


      <div class="section">
        <div class="title2 margin">Services</div>
        <div class="serviceGrid">
          <ServiceItem v-for="(service, index) in data.services"
                       :name="service.name"
                       :desc="service.desc"
                       :image="service.image"
                       :key="index"
          />
        </div>
      </div>



    </div>
</template>


<style scoped lang="scss">

@import "../assets/Colors";

.home {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.serviceGrid{
  display: grid;
  grid-template-columns: repeat(3,1fr);
  grid-gap: 2rem;
}

.margin{
  margin-bottom: 2rem;
}


.headerCol{
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.art{
  transform: rotateY(180deg) rotate(270deg);
  background-size: cover;
  width: 100%;
  color: $primary;
}

.contactCol{
  padding: 1vw;
  background-color: $bg2;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.label{
  text-align: left;
}

.profileImage{
  border-radius: 50%;
  aspect-ratio: 1/1;
  background-image: url("/images/kisori/kisori.jpg");
  background-size: cover;
  background-position: 100% 100%;
}

.section{
  padding: 2rem;
  min-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title{
  font-size: calc(12px + 1vw);
}


.headerInfo {
  display: flex;
  text-align: left;
  flex-direction: column;
  height: 50%;
  align-items: center;
}

.title {
  font-family: "Pattaya", sans-serif;
  font-size: calc(12px + 2vw);
  color: $primary;
}

.title2{
  font-size: calc(12px + 1.5vw);
}

.tagline {
  width: 60%;
  font-size: calc(12px + 1.2vw);
  font-weight: 700;
  color: $primary;
  justify-self: center;
  text-align: center;
  margin: 3rem;
}

.subtitle {
  font-family: "Comfortaa", sans-serif;
  font-weight: 700;
  color: $primary;
}

.headerGrid {
  padding: 2rem;
  display: grid;
  grid-gap: 2rem;
  grid-template-columns: repeat(3, 1fr);
}

.navBtn{
  margin-left: auto;
  margin-right: 1vw;
}

.headerImage {
  background-image: url('/images/pregnancy/pregnancy1.jpg');
  background-size: cover;
  background-position: 50% 70%;
  border-radius: 50vh 50vh 24px 24px;
  height: 70%;
  width: 100%;
}

.intro {
  justify-self: center;
  text-align: justify;
}

input{
  background-color: $background;
  width: 100%;
  border: none;
  border-radius: 24px;
  padding: 1vw;
  margin-bottom: 1vw;
  font-family: "Libre Baskerville", serif;
}


</style>
