<script setup lang="ts">
import data from '@/data/data'

const copy = data.copy
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="wrap footer__grid">
      <div class="footer__brand">
        <p class="footer__wordmark display">
          <span>{{ copy.brand.wordA }}</span> <em>{{ copy.brand.wordOf }}</em> <span>{{ copy.brand.wordB }}</span>
        </p>
        <p class="footer__sub">{{ data.about.subtitle }}</p>
        <img class="footer__badge" src="/images/badge.png" alt="Certification badge" />
      </div>

      <nav class="footer__col" aria-label="Footer">
        <RouterLink to="/">{{ copy.nav.home }}</RouterLink>
        <RouterLink to="/about">{{ copy.nav.about }}</RouterLink>
        <RouterLink to="/offer">{{ copy.nav.offer }}</RouterLink>
        <RouterLink to="/contact">{{ copy.nav.contact }}</RouterLink>
      </nav>

      <div class="footer__col">
        <a href="#" rel="noopener">{{ copy.footer.instagram }}</a>
        <a href="#" rel="noopener">{{ copy.footer.facebook }}</a>
      </div>
    </div>

    <div class="footer__ghost display" aria-hidden="true">
      <span>{{ copy.brand.wordA }}</span> <em>{{ copy.brand.wordOf }}</em> <span>{{ copy.brand.wordB }}</span>
    </div>

    <div class="wrap footer__legal">
      <!-- the name is its own element: the year beside it can never match a key -->
      <span>© {{ year }} <span>{{ copy.footer.legalName }}</span></span>
      <span>{{ copy.footer.place }}</span>
    </div>
  </footer>
</template>

<style scoped lang="scss">
@import "../assets/Colors.scss";
@import "../assets/Text.scss";

.footer {
  position: relative;
  background: $ink;
  color: $cream;
  overflow: hidden;
  padding-top: clamp(4rem, 8vw, 7rem);
}

.footer__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: clamp(2rem, 5vw, 5rem);

  @media (max-width: 760px) { grid-template-columns: 1fr; }
}

.footer__wordmark {
  font-size: clamp(1.9rem, 3.5vw, 2.6rem);

  em { color: $rose; }
}

.footer__sub {
  margin-top: 0.9rem;
  font-size: $small;
  color: rgba(255, 253, 248, 0.62);
  max-width: 34ch;
}

.footer__badge {
  margin-top: 1.6rem;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: $cream;
  object-fit: contain;
}

.footer__col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding-top: 0.4rem;

  a {
    width: fit-content;
    font-size: 1.02rem;
    font-weight: 300;
    color: rgba(255, 253, 248, 0.85);
    transition: color 0.4s, transform 0.5s var(--ease);

    &:hover { color: $rose; transform: translateX(6px); }
  }
}

.footer__ghost {
  font-size: clamp(5rem, 17vw, 16rem);
  line-height: 0.9;
  text-align: center;
  color: rgba(255, 253, 248, 0.06);
  white-space: nowrap;
  margin-top: clamp(2rem, 5vw, 4rem);
  transform: translateY(12%);
  user-select: none;
}

.footer__legal {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-block: 1.4rem;
  border-top: 1px solid rgba(255, 253, 248, 0.14);
  font-size: $tiny;
  color: rgba(255, 253, 248, 0.55);
}
</style>
