/**
 * The public route table, with each page's SEO record.
 *
 * This is the only list of public routes. The router spreads it; the
 * prerender (scripts/prerender.ts) walks it to write one HTML file per page,
 * the sitemap, robots.txt and llms.txt; the runtime applies the same records on
 * navigation. Bodies are built from data.ts and serviceDetails.ts, the same
 * tree the pages render and the studio editor patches. No browser dependency
 * here: the prerender imports this under Node.
 */
import type { RouteRecordRaw } from 'vue-router'
import { esc, personNode, serviceNode } from '@/kit/seo'
import HomePage from '@/pages/HomePage.vue'
import data from '@/data/data'
import serviceDetails from '@/data/serviceDetails'

/* ------------------------------ helpers ------------------------------ */

const list = (items: readonly string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
const taglines = (d: object): string[] => {
  const t = 'tagline' in d ? (d.tagline as string | readonly string[] | undefined) : undefined
  return !t ? [] : typeof t === 'string' ? [t] : [...t]
}

/** the four offerings, in the order the Offer page shows them, with its anchors */
const offerings = () => {
  const d = serviceDetails
  return [
    { id: 'childbirth', detail: d.childbirth, type: 'Childbirth education' },
    { id: 'doula', detail: d.doula, type: 'Birth doula support' },
    { id: 'birth-plan', detail: d.birthPlan, type: 'Birth plan support' },
    { id: 'car-seat', detail: d.carSeat, type: 'Child passenger safety' },
  ] as const
}

/** research copy ships as "lead\n* bullet\n* bullet" strings */
const research = () =>
  data.research.map((r) => {
    const lines = r.desc.split('\n').map((l) => l.trim()).filter(Boolean)
    return { name: r.name, hook: r.hook, lead: lines.filter((l) => !l.startsWith('*')).join(' '), bullets: lines.filter((l) => l.startsWith('*')).map((l) => l.replace(/^\*\s*/, '')) }
  })

/* ------------------------------ bodies ------------------------------ */

const homeBody = () =>
  `<main><h1>Peace of Mind Birth Education</h1><p>${esc(data.about.tagline)}</p><p>${esc(data.about.subtitle)}</p>` +
  `<h2>How I can support you</h2><ul>${data.services.map((s, i) => `<li><h3><a href="/offer#${offerings()[i]?.id ?? ''}">${esc(s.name)}</a></h3><p>${esc(s.desc)}</p></li>`).join('')}</ul>` +
  `<h2>Hi, I'm Kisori.</h2><p>${esc(data.about.bioShort)} <a href="/about">More about me</a>.</p>` +
  `<h2>Backed by evidence, not opinion</h2>${research()
    .map((r) => `<h3>${esc(r.name)}</h3><p>${esc(r.hook)}</p><p>${esc(r.lead)}</p>${list(r.bullets)}`)
    .join('')}` +
  `<h2>${esc(data.copy.home.ctaHeading)}</h2><p>${esc(data.copy.home.ctaSub)} <a href="/contact">Let's connect</a>.</p></main>`

const aboutBody = () =>
  `<main><h1>Hi, I'm Kisori.</h1><p>${esc(data.about.intro)}</p><h2>My mission</h2><p>${esc(data.about.introShort)}</p>` +
  `<h2>Certifications</h2>${list(data.certs.map((c) => c.replace(/\s+/g, ' ')))}<h2>Memberships</h2>${list(data.memberships)}` +
  `<p>${esc(data.copy.about.ctaSub)} <a href="/contact">Let's connect</a>.</p></main>`

const offerBody = () =>
  `<main><h1>What I offer</h1><p>${esc(data.about.subtitle)}</p>` +
  offerings()
    .map(
      ({ id, detail }) =>
        `<section id="${id}"><h2>${esc(detail.title)}</h2>${taglines(detail)
          .map((t) => `<p>${esc(t)}</p>`)
          .join('')}${'fullDesc' in detail ? `<p>${esc(detail.fullDesc)}</p>` : ''}<h3>Includes</h3>${list(detail.includes)}<p>${esc(data.copy.offer.priceLabel)} ${esc(detail.priceValue)}</p></section>`,
    )
    .join('') +
  `<h2>Sliding scale</h2><p>${esc(serviceDetails.slidingScale)} <a href="/contact">Reach out</a>.</p></main>`

const contactBody = () =>
  `<main><h1>Let's connect.</h1><p>${esc(data.copy.contact.blurb)}</p>${list(data.copy.contact.facts)}` +
  `<h2>Services</h2><ul>${data.services.map((s) => `<li>${esc(s.name)}</li>`).join('')}</ul><p>Use the contact form on this page to share where you are in your journey.</p></main>`

/* ------------------------------ the table ------------------------------ */

export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: {
      seo: {
        description:
          'Evidence-based childbirth education, birth doula support and car seat safety checks in the Denver metro area, rooted in reproductive and birth justice.',
        body: homeBody,
      },
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/pages/AboutPage.vue'),
    meta: {
      seo: {
        title: 'About Kisori',
        description:
          'Meet Kisori, an ICEA-certified childbirth educator and car seat technician in Denver, offering education rooted in reproductive and birth justice.',
        image: { url: '/images/kisori/kisori.jpg', alt: 'Kisori, founder of Peace of Mind Birth Education' },
        type: 'profile',
        schema: ({ site }) =>
          personNode(site, {
            path: '/about',
            name: 'Kisori',
            jobTitle: 'Founder and childbirth educator',
            image: '/images/kisori/kisori.jpg',
            description: data.about.bioShort,
          }),
        body: aboutBody,
      },
    },
  },
  {
    path: '/offer',
    name: 'offer',
    component: () => import('@/pages/OfferPage.vue'),
    meta: {
      seo: {
        title: 'Childbirth classes, doula support and car seats',
        description:
          'Private childbirth education, birth plan support, birth doula support and car seat checks in the Denver metro area, with prices and a sliding scale.',
        // one Service per offering; no path, so each keeps its own node
        schema: ({ site }) =>
          offerings().map(({ detail, type }) =>
            serviceNode(site, {
              name: detail.title,
              type,
              description: 'fullDesc' in detail ? detail.fullDesc : (taglines(detail)[0] ?? detail.title),
              offers: { description: detail.priceValue },
            }),
          ),
        body: offerBody,
      },
    },
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/pages/ContactPage.vue'),
    meta: {
      seo: {
        title: 'Contact',
        description:
          'Contact Kisori about childbirth education, doula support or a car seat check in the Denver metro area. In-person, virtual and hybrid, sliding scale available.',
        body: contactBody,
      },
    },
  },
]

/** The catch-all: a real not-found page, noindex, never a redirect home. */
export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('@/pages/NotFoundPage.vue'),
  meta: { seo: { title: 'Page not found', description: 'That page is not on peaceofmindbirthed.com.', noindex: true } },
}
