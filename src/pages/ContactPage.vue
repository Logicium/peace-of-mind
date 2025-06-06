<script setup lang="ts">
import data from "../data/data.ts";
import FlowerArt3 from "@/assets/line-art/FlowerArt3.vue";
import StemArt2 from "@/assets/line-art/StemArt2.vue";
import { ref, reactive } from 'vue';

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const phone = ref('');
const interestedService = ref('');
const referralSource = ref('');

const services = data.services.map(service => service.name);

// Form submission state
const isSubmitting = ref(false);
const submitStatus = reactive({
  success: false,
  message: '',
  visible: false
});

// Function to show message with timeout
const showMessage = (message:any, isSuccess:any) => {
  submitStatus.message = message;
  submitStatus.success = isSuccess;
  submitStatus.visible = true;

  // Hide message after 4 seconds
  setTimeout(() => {
    submitStatus.visible = false;
  }, 4000);
};

const submitForm = async () => {
  // Basic validation
  if (!firstName.value || !lastName.value || !email.value || !phone.value ||
      !interestedService.value || !referralSource.value) {
    showMessage('Please fill out all fields', false);
    return;
  }

  isSubmitting.value = true;

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/email/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        phone: phone.value,
        interestedService: interestedService.value,
        referralSource: referralSource.value
      })
    });

    const result = await response.json();

    showMessage(result.message, result.success);

    if (result.success) {
      // Reset form on success
      firstName.value = '';
      lastName.value = '';
      email.value = '';
      phone.value = '';
      interestedService.value = '';
      referralSource.value = '';
    }
  } catch (error) {
    showMessage('An error occurred. Please try again later.', false);
    console.error('Error submitting form:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="contactPage">

    <div class="contactSection">

      <div class="contactHeader">
        <div class="headerContent">
          <div class="banner">Let's Connect</div>
          <div class="contactText">
            I'd love to hear from you! Please fill out the form below and I'll get back to you as soon as possible.
          </div>
        </div>
      </div>

      <div class="contactFormContainer">
        <form @submit.prevent="submitForm" class="contactForm">
          <div class="formRow">
            <div class="formGroup">
              <label for="firstName" class="formLabel">First Name</label>
              <input
                type="text"
                id="firstName"
                v-model="firstName"
                class="formInput"
                required
              />
            </div>

            <div class="formGroup">
              <label for="lastName" class="formLabel">Last Name</label>
              <input
                type="text"
                id="lastName"
                v-model="lastName"
                class="formInput"
                required
              />
            </div>
          </div>

          <div class="formRow">
            <div class="formGroup">
              <label for="email" class="formLabel">Email</label>
              <input
                type="email"
                id="email"
                v-model="email"
                class="formInput"
                required
              />
            </div>

            <div class="formGroup">
              <label for="phone" class="formLabel">Phone Number</label>
              <input
                type="tel"
                id="phone"
                v-model="phone"
                class="formInput"
                required
              />
            </div>
          </div>

          <div class="formGroup">
            <label for="service" class="formLabel">Which services are you interested in?</label>
            <select
              id="service"
              v-model="interestedService"
              class="formSelect"
              required
            >
              <option value="" disabled selected>Select a service</option>
              <option v-for="service in services" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
          </div>

          <div class="formGroup">
            <label for="referral" class="formLabel">How did you hear about me?</label>
            <input
              type="text"
              id="referral"
              v-model="referralSource"
              class="formInput"
              required
            />
          </div>

          <div v-if="submitStatus.visible" class="formMessage" :class="{ 'success': submitStatus.success, 'error': !submitStatus.success }">
            {{ submitStatus.message }}
          </div>

          <button type="submit" class="submitButton btn oval" :disabled="isSubmitting">
            {{ isSubmitting ? 'SENDING...' : 'SUBMIT' }}
          </button>
        </form>

        <div class="contactSideDecor">
          <FlowerArt3 />
        </div>
      </div>

    </div>



  </div>
</template>

<style scoped lang="scss">
@import "../assets/Text";
@import "../assets/Colors";

.contactPage {
  display: flex;
  flex-direction: column;
  min-height:  calc(100vh - 200px);
  padding: 0 24px;
  background-color: $background;
  max-width: 1200px;
  margin: 0 auto;
}

.contactSection {
  position: relative;
  padding: $paddingLg;
  margin-top: $paddingMd;
  border-radius: 24px;
  background-color: $background;
}

.contactHeader {
  position: relative;
  display: flex;
  justify-content: center;
  text-align: center;
  margin-top: 200px;
  padding: 50px 0 50px;
  background-color: $secondary;
  border-radius: 24px;
  margin-bottom: 50px;
}

.headerContent {
  max-width: 80%;
  text-align: center;
}

.contactText {
  margin-top: $paddingMd;
  font-size: $fontNormal;
  line-height: 1.6;
}

.decorElement {
  position: absolute;
  width: 250px;
  height: 250px;
  right: 0;
  top: 20%;
  color: $primary;
}

.contactFormContainer {
  display: flex;
  position: relative;
  margin-top: $paddingLg;
  padding-bottom: 50px;
}

.contactForm {
  background-color: $secondary;
  border-radius: 24px;
  padding: $paddingLg;
  width: 70%;
  margin: 0 auto;
}

.formRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $paddingMd;
  margin-bottom: $paddingMd;
}

.formGroup {
  margin-bottom: $paddingMd;
}

.formLabel {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: $primary;
}

.formInput, .formSelect {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 24px;
  background-color: $background;
  font-family: "Outfit", sans-serif;
  font-size: $fontNormal;
  color: $primary;
  box-sizing: border-box;
}

.formSelect {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 12px top 50%;
  background-size: 12px auto;
  padding-right: 30px;
}

.submitButton {
  display: block;
  margin: $paddingLg auto 0;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.formMessage {
  padding: 10px 15px;
  border-radius: 24px;
  margin-bottom: 15px;
  text-align: center;
  animation: fadeIn 0.3s ease-in-out;

  &.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  &.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.contactSideDecor {
  position: absolute;
  width: 200px;
  height: 200px;
  bottom: 2%;
  left: -2%;
  transform: rotate(-45deg);
  color: $primary;
  z-index: 1;
}

.button{
  outline: none;
  border: none !important;
  box-shadow: none !important;
}

@media (max-width: 768px) {
  .headerContent {
    max-width: 100%;
  }

  .contactForm {
    width: 90%;
  }

  .formRow {
    grid-template-columns: 1fr;
  }

  .contactSideDecor {
    display: none;
  }
}
</style>
