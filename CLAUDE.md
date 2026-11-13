# CLAUDE.md

<!-- apotome-standard:seo -->
## Standard: SEO + AEO

This site follows the Apotome Labs SEO + AEO Standard, version 1.1
(https://www.apotomelabs.com/standards/seo). The shared module in `src/kit/seo/` (apotome-seo
1.3.0) implements it. These rules apply to every change.

- `src/kit/seo/` is vendored. Never edit it here: change `../apotome-seo/src`, then run
  `node ../apotome-seo/vendor.mjs <this repo> --into src/kit/seo`. That also refreshes this section.
- `src/routes.ts` is the one list of public routes. Each has a `meta.seo` record: `title` (the
  page part only; the brand is added), a unique answer-first `description` of 120 to 160
  characters, `schema` built with the module's builders, and `body` built from the data modules
  so the prerendered page carries real text. A dynamic route also has `expand()`. A new public
  page goes there, never only into the router.
- Site facts (name, address, phone, hours, socials, crawler policy, private prefixes) live in
  `src/seo.site.ts`. Take them only from the client's own data. Never invent one; the build fails
  on placeholders such as 555 numbers, sample addresses and example domains.
- The prerender (`postbuild`) owns the head, JSON-LD, `sitemap.xml`, `robots.txt`, `llms.txt` and
  `404.html`. Never hand-write any of them, set `document.title`, add `@unhead` or `@vueuse/head`,
  or put page meta in `index.html`. A page whose head depends on fetched data calls
  `useSeoData(record)`.
- Admin, account, checkout, order, auth and preview routes go in `privatePrefixes` in
  `src/seo.site.ts` and in the `X-Robots-Tag` rule of `vercel.json`.
- `siteUrl` is the host that answers 200, usually `www`. Check with `curl -I` before changing it.
- Copy opens with the plain answer: who, what, where, and the one fact that matters. Specific
  facts, real HTML tables for hours and prices, no keyword lists, no em dashes.
- Images have `width`, `height` and alt text, load lazily below the fold, and ship as AVIF or WebP.
- Verify with `npm run build`. It must pass, and `dist/seo-report.json` must show no warnings you
  did not mean. Open one built page and check it has one title, description, canonical and
  JSON-LD graph.
<!-- /apotome-standard:seo -->
