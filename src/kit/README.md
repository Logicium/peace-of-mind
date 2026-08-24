# Apotome Kit

Drop-in pieces for bespoke client sites. Everything here is designed to be
copy-vendored: paste the file into the client repo at `src/kit/`, wire the
env vars, done. No npm package, no build step, no shared dependency.

## analytics.ts

Cookieless pageview beacon feeding the Apotome Labs portal analytics.

1. Copy `analytics.ts` into the client site at `src/kit/analytics.ts`.
2. Add env vars to the site's deployment:
   - `VITE_ANALYTICS_SITE_KEY` - the project's site key (shown on the
     project page in the Apotome admin under Analytics beacon)
   - `VITE_API_URL` - the Apotome Labs service origin
3. Initialize once at boot (Vue example, in `main.ts` or the router file):

```ts
import { initApotomeAnalytics } from '@/kit/analytics'
import router from './router'

initApotomeAnalytics({
  siteKey: import.meta.env.VITE_ANALYTICS_SITE_KEY,
  apiUrl: import.meta.env.VITE_API_URL,
  router,
})
```

Sites without a router still work: omit `router` and the History API is
patched instead.

Privacy: no cookies, no localStorage, no fingerprinting. The server hashes
(site, ip, user agent, daily salt) to count unique visitors and the salt
rotates every UTC day, so visits cannot be linked across days. No consent
banner needed.

## editor/

In-situ content editor: the client opens their live site with `#edit` in
the URL, signs in with their Apotome portal credentials, flips Edit on,
and types directly into the page. Text commits on blur; photos get a
hover Replace control (client-side WebP optimization, uploaded to blob
storage or inlined). Save draft or Publish sends a full versioned
snapshot to the service; the portal keeps history with restore.

Requirements on the site:

1. All editable content in ONE `reactive()` object that components
   render from (e.g. `src/data/site.ts` exporting
   `export const siteData = reactive({ ... })`).
2. Vendor the whole `editor/` folder to `src/kit/editor/`.
3. In `main.ts`:

```ts
import { applyDeep, initApotomeEditor, loadPublishedContent } from '@/kit/editor'
import { siteData } from '@/data/site'

const kit = {
  siteKey: import.meta.env.VITE_ANALYTICS_SITE_KEY,
  apiUrl: import.meta.env.VITE_API_URL,
}

loadPublishedContent(kit).then((overlay) => {
  if (overlay) applyDeep(siteData, overlay)
  initApotomeEditor({ ...kit, config: siteData })
})
```

Visitors never see any of it: the bar only mounts when the URL contains
`#edit` or an editor session already exists on the device. Publishing is
gated server-side by the project owner's account, so the hash is a
doorbell, not a lock.
