<script setup lang="ts">
import { createApotomeForm } from '@/kit/forms'
import data from '@/data/data'

const copy = data.copy
/* the dot colours cycle with the facts, so a fourth fact still gets one */
const factAccents = ['var(--iris)', 'var(--rose)', 'var(--meadow)']
import FloraField from '@/components/FloraField.vue'
import type { FloraItem } from '@/components/FloraField.vue'
import { ref, reactive } from 'vue'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const interestedService = ref('')
const referralSource = ref('')

const services = data.services.map((service) => service.name)

const isSubmitting = ref(false)
const submitStatus = reactive({
  success: false,
  message: '',
  visible: false,
})

const showMessage = (message: string, isSuccess: boolean) => {
  submitStatus.message = message
  submitStatus.success = isSuccess
  submitStatus.visible = true

  setTimeout(() => {
    submitStatus.visible = false
  }, 4000)
}

/*
 * Contact runs through the Apotome Labs add-on service. The field names are
 * unchanged on purpose, so the service keeps receiving exactly what it did
 * before the redesign.
 */
const contactForm = createApotomeForm({ form: 'contact' })

/* the decoy field; a real visitor never sees it, so it must stay empty */
const honeypot = ref('')

const submitForm = async () => {
  if (
    !firstName.value || !lastName.value || !email.value || !phone.value ||
    !interestedService.value || !referralSource.value
  ) {
    showMessage('Please fill out all fields', false)
    return
  }

  isSubmitting.value = true

  try {
    const result = await contactForm.submit({
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      phone: phone.value,
      interestedService: interestedService.value,
      referralSource: referralSource.value,
      [contactForm.honeypotField]: honeypot.value,
    })

    if (result.ok) {
      showMessage(result.data.message, true)
      firstName.value = ''
      lastName.value = ''
      email.value = ''
      phone.value = ''
      interestedService.value = ''
      referralSource.value = ''
    } else {
      showMessage(result.error, false)
    }
  } finally {
    isSubmitting.value = false
  }
}

const flora: FloraItem[] = [
  { art: 'poppy', at: { top: '10%', left: '-6%' }, size: 'clamp(160px, 18vw, 300px)', tint: 'var(--blush)', opacity: 0.95, blur: 1, speed: 0.07, rotate: 5, baseRotate: -12, mouse: 0.02 },
  { art: 'sakura', at: { bottom: '12%', left: '10%' }, size: 'clamp(90px, 10vw, 160px)', tint: 'var(--iris)', opacity: 0.85, speed: 0.16, rotate: -8, baseRotate: 22, mouse: 0.04 },
  { art: 'stem2', at: { top: '46%', left: '30%' }, size: 'clamp(70px, 8vw, 130px)', tint: 'var(--meadow)', opacity: 0.75, speed: 0.11, baseRotate: -18 },
]
</script>

<template>
  <main class="contact">
    <FloraField :items="flora" />

    <div class="wrap contact__grid">
      <div class="contact__intro">
        <h1 class="display contact__title">
          <span v-reveal:up="0.05">{{ copy.contact.titleA }}</span>
          <span class="contact__accent" v-reveal:up="0.16"><em>{{ copy.contact.titleEm }}</em></span>
        </h1>
        <p class="lead contact__blurb" v-reveal:up="0.3">{{ copy.contact.blurb }}</p>
        <ul class="contact__facts" v-reveal:up="0.4">
          <li v-for="(fact, i) in copy.contact.facts" :key="i">
            <span class="dot" :style="{ '--accent': factAccents[i % factAccents.length] }" />
            <span>{{ fact }}</span>
          </li>
        </ul>
      </div>

      <div class="contact__formWrap" v-reveal:up="0.2">
        <form @submit.prevent="submitForm" class="form">
          <div class="form__row">
            <div class="form__group">
              <label for="firstName" class="form__label">{{ copy.contact.labelFirst }}</label>
              <input type="text" id="firstName" v-model="firstName" class="form__input" required autocomplete="given-name" />
            </div>
            <div class="form__group">
              <label for="lastName" class="form__label">{{ copy.contact.labelLast }}</label>
              <input type="text" id="lastName" v-model="lastName" class="form__input" required autocomplete="family-name" />
            </div>
          </div>

          <div class="form__row">
            <div class="form__group">
              <label for="email" class="form__label">{{ copy.contact.labelEmail }}</label>
              <input type="email" id="email" v-model="email" class="form__input" required autocomplete="email" />
            </div>
            <div class="form__group">
              <label for="phone" class="form__label">{{ copy.contact.labelPhone }}</label>
              <input type="tel" id="phone" v-model="phone" class="form__input" required autocomplete="tel" />
            </div>
          </div>

          <div class="form__group">
            <label for="service" class="form__label">{{ copy.contact.labelService }}</label>
            <select id="service" v-model="interestedService" class="form__input form__select" required>
              <option value="" disabled selected>{{ copy.contact.servicePlaceholder }}</option>
              <option v-for="service in services" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
          </div>

          <div class="form__group">
            <label for="referral" class="form__label">{{ copy.contact.labelReferral }}</label>
            <input type="text" id="referral" v-model="referralSource" class="form__input" required />
          </div>

          <Transition name="msg">
            <div
              v-if="submitStatus.visible"
              class="form__message"
              :class="submitStatus.success ? 'form__message--ok' : 'form__message--err'"
            >
              {{ submitStatus.message }}
            </div>
          </Transition>

          <!--
            Honeypot. Positioned off-screen rather than type="hidden": a hidden
            input is trivially skipped by a bot, a text input moved out of the
            viewport is not. Kept out of the tab order and the a11y tree.
          -->
          <div class="hp" aria-hidden="true">
            <label :for="contactForm.honeypotField">Do not fill this in</label>
            <input
              :id="contactForm.honeypotField"
              v-model="honeypot"
              type="text"
              tabindex="-1"
              autocomplete="off"
            />
          </div>

          <button type="submit" class="pill pill--iris form__submit" :disabled="isSubmitting">
            {{ isSubmitting ? copy.contact.submitting : copy.contact.submit }}
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.contact {
  position: relative;
  min-height: 100svh;
  padding-top: calc(4.75rem + clamp(2.5rem, 6vw, 5rem));
  padding-bottom: $section;
  overflow: clip;
}

.contact__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: clamp(2.5rem, 6vw, 7rem);
  align-items: start;

  @media (max-width: 860px) { grid-template-columns: 1fr; }
}

.contact__title {
  font-size: clamp(3.6rem, 9.5vw, 8.5rem);
  line-height: 0.98;

  span { display: block; }
}

.contact__accent {
  padding-left: clamp(1rem, 4vw, 4rem);
  color: $rose;
}

.contact__blurb {
  margin-top: clamp(1.6rem, 3vw, 2.4rem);
  max-width: 38ch;
}

.contact__facts {
  list-style: none;
  margin: clamp(1.8rem, 3vw, 2.6rem) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-weight: 400;
    font-size: 0.98rem;
  }
}

// ── form ───────────────────────────────────────────────────────────────
.contact__formWrap {
  background: $cream;
  border: 1px solid $hairline;
  border-radius: clamp(28px, 4vw, 48px);
  padding: clamp(1.8rem, 4vw, 3.2rem);
  box-shadow: 0 30px 80px rgba(43, 31, 61, 0.07);
}

.form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;

  @media (max-width: 560px) { grid-template-columns: 1fr; }
}

.form__group { margin-bottom: 1.35rem; }

.form__label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.form__input {
  width: 100%;
  padding: 0.95rem 1.3rem;
  border: 1.5px solid transparent;
  border-radius: 18px;
  background: $paper;
  font-family: $font-body;
  font-size: 1rem;
  font-weight: 300;
  color: $ink;
  transition: border-color 0.4s var(--ease), background-color 0.4s;

  &:focus {
    outline: none;
    border-color: $iris;
    background: $cream;
  }
}

.form__select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232B1F3D' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1.1rem center;
  background-size: 1rem;
  padding-right: 2.8rem;
  cursor: pointer;
}

.form__message {
  padding: 0.85rem 1.2rem;
  border-radius: 16px;
  margin-bottom: 1.2rem;
  text-align: center;
  font-weight: 400;

  &--ok { background: $mint; color: #1E6F4B; }
  &--err { background: $blush; color: #9E2558; }
}

.msg-enter-active, .msg-leave-active { transition: opacity 0.4s, transform 0.4s var(--ease); }
.msg-enter-from, .msg-leave-to { opacity: 0; transform: translateY(-8px); }

.form__submit {
  width: 100%;
  margin-top: 0.4rem;
}

/* honeypot: out of sight and out of the tab order, but a real input */
.hp {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>
