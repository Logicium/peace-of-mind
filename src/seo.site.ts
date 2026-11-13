/**
 * Who this site is, for search engines and assistants.
 *
 * The one record behind every title suffix, canonical, share card, robots
 * policy and the ProfessionalService node on the home page. Pure data: the
 * prerender imports it under Node and the app imports it in the browser. At
 * build the client's published Search settings from the studio portal lay
 * over it.
 *
 * Facts come from data.ts and serviceDetails.ts only. No phone, street
 * address or hours: the site does not state them. No social profiles: the
 * footer's Instagram and Facebook links have no address yet.
 */
import type { SiteConfig } from '@/kit/seo'
import data from '@/data/data'

export const site: SiteConfig = {
  siteUrl: 'https://www.peaceofmindbirthed.com',
  name: 'Peace of Mind Birth Education',
  tagline: 'Childbirth education in Denver',
  description:
    'Evidence-based childbirth education, birth doula support and car seat safety checks in the Denver metro area, rooted in reproductive and birth justice.',
  lang: 'en',
  locale: 'en_US',
  image: { url: '/og/default.png', width: 1200, height: 630, alt: 'Peace of Mind Birth Education, childbirth education in Denver' },
  entity: {
    type: 'ProfessionalService',
    name: 'Peace of Mind Birth Education',
    legalName: data.copy.footer.legalName,
    description: data.about.introShort,
    logo: '/images/logo.png',
    image: '/og/default.png',
    address: { addressLocality: 'Denver', addressRegion: 'CO', addressCountry: 'US' },
    areaServed: ['Denver metro area, Colorado'],
    knowsAbout: ['Childbirth education', 'Birth doula support', 'Birth plans', 'Child passenger safety', 'Reproductive justice', 'Birth justice'],
  },
  crawlers: { training: 'allow' },
  // the site has no admin, portal, auth or checkout routes; the studio editor is a #edit hash
  privatePrefixes: ['/api'],
  llmsSummary:
    'Peace of Mind Birth Education LLC is a childbirth education and birth doula practice in the Denver metro area, run by Kisori, an ICEA-certified childbirth educator and nationally certified Child Passenger Safety Technician. It offers private childbirth education, birth plan support, birth doula support and car seat safety checks, in person, virtually or hybrid, on a sliding scale.',
}
