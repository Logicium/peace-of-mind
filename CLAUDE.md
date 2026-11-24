# CLAUDE.md

<!-- apotome-standard:seo -->
## Standard: SEO + AEO

This site follows the Apotome Labs SEO + AEO Standard, version 1.1
(https://www.apotomelabs.com/standards/seo). The shared module in `src/kit/seo/` (apotome-seo
1.4.2) implements it. These rules apply to every change.

- `src/kit/seo/` is vendored. Never edit it here: change `../apotome-seo/src`, then run
  `node ../apotome-seo/vendor.mjs <this repo> --into src/kit/seo`. That also refreshes this section.
- `src/routes.ts` is the one list of public routes. Each has a `meta.seo` record: `title` (the
  page part only; the brand is added), a unique answer-first `description` of 120 to 160
  characters, `schema` built with the module's builders, and `body` built from the data modules
  so the prerendered page carries real text, or `bodyComponent` for a self-contained component such
  as a legal document. A dynamic route also has `expand()`. Never use `render: 'browser'`: hosted
  builds have no Chrome. A new public
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

<!-- apotome-standard:quality -->
## Standard: Code Quality and Performance

This project follows the Apotome Labs Code Quality and Performance Standard, version 1.0
(https://www.apotomelabs.com/standards/code-quality). `scripts/quality/` (@apotome/quality 0.1.0)
checks it on every build; `quality.config.mjs` sets report or enforce mode. These rules apply to every change.

Before writing
- Read the file and its neighbours. Search utils/, the vendored modules and the other repos for an existing
  helper, component or token before making one.
- Stay inside the asked scope; fix real defects in the same feature in the same pass.

Shape
- Folders: pages/, components/<feature>/, components/ui/, composables/, data/, services/api/, styles/, utils/.
- No source file over 600 lines (data and token files exempt); components aim for under 300. A banner comment
  means the file is due for a split.
- `<script setup lang="ts">`, template, `<style scoped lang="scss">`. Typed props and emits, defineModel,
  `:key` on every v-for. Buttons for actions, links for navigation, labels on fields, alt on images.

Styles
- SCSS with `@use`, never `@import`. Mixins come from the injected `_tools.scss`.
- Colours and theme are CSS custom properties with role names (--surface, --ink, --accent). No raw colours
  in components. Spacing, type, radius and motion come from the scales. Respect prefers-reduced-motion.

Helpers and data
- Dates, money (integer cents), phone, escaping and slugs have one home. Never pass a calendar day to new Date().
- Copy lives in data/. API calls go through services/api/ (client plus one file per domain, types beside the call).
- Never edit a vendored file (`scripts/quality/`, src/kit/, src/seo/): fix it in apotome-catalog and re-vendor.

Line shape
- If it fits on one line of 120 characters, it is on one line. No semicolons, single quotes. No ESLint or Prettier.

No slop
- No comments that restate code or narrate changes; comments say why.
- No options, compatibility layers or fallback chains nobody needs. Delete what you replace in the same commit.
- No .bak/.tmp/.new files, starter files, data dumps, or summary .md files.
- A failed load or save is visible to the person; best-effort work may fail quietly.

Performance
- Public pages: first-visit JavaScript under 170 KB gzip (aim for 100). Three.js, maps, charts and editors load lazily.
- No image over 500 KB; width and height on every image.

Check with `npm run quality` (add `-- --types` for unused locals). Re-vendor with
`node ../apotome-catalog/vendor.mjs . quality`.
<!-- /apotome-standard:quality -->
