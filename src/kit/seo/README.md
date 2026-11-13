# @apotome/seo

The Apotome Labs SEO + AEO Standard, as code. One route table and one site
config produce every page's head, its JSON-LD graph, a static HTML file per
public route, `sitemap.xml`, `robots.txt`, `llms.txt` and `404.html`. The
runtime half applies the same head on client navigation.

Vendored into each site (no registry): `node ../apotome-seo/vendor.mjs <site> [--into src/seo]`.
Edit the source here, re-run the vendor script, rebuild the site.

## Wiring a site

1. `src/seo.site.ts` exports a `SiteConfig`: canonical `siteUrl`, brand `name`,
   `tagline`, fallback `description`, default share `image` (1200 x 630, in
   `public/`), the `entity` (schema.org type, NAP, geo, hours, `sameAs`), the
   crawler `training` policy, and `privatePrefixes`.
2. `src/routes.ts` exports `publicRoutes: RouteRecordRaw[]`, each with
   `meta.seo`: `title`, `description`, `image`, `type`, `breadcrumb`,
   `lastmod`, `schema(ctx)`, `body(ctx)`, or `bodyComponent` (a self-contained component the
   prerender server-renders under Node, for legal pages and the like). A dynamic route adds `expand(ctx)`
   returning `{ params, data }` instances and its fields become functions of
   `({ site, path, params, data })`. Export `notFoundRoute` for the catch-all
   with `noindex: true`.
3. The router spreads `publicRoutes` and ends with `notFoundRoute`. Private
   routes stay in the router under a private prefix.
4. `main.ts`: `installSeo(router, site)`. A page whose head depends on fetched
   data calls `useSeoData(record)`.
5. `scripts/prerender.ts`:

   ```ts
   import { prerender } from '../src/seo/node'
   import { publicRoutes } from '../src/routes'
   import { site } from '../src/seo.site'
   await prerender({ site, routes: publicRoutes, root: new URL('..', import.meta.url) })
   ```

   `package.json`: `"postbuild": "vite-node scripts/prerender.ts"` with
   `vite-node` as a dev dependency. Options: `render: 'browser'` snapshots the
   built app with puppeteer when installed; `llmsFull: true` writes
   `llms-full.txt`; `layout: 'directory'` for hosts without clean URLs.
6. `vercel.json` from `vercelConfig()` in `vercel.ts`, or copy the shape in the
   standard, section 4.5. `index.html` keeps `lang`, viewport, theme-color and
   icons only; nothing page-specific.
7. Exclude the Node files from the app tsconfig and include them in the node
   one: `node.ts`, `prerender.ts`, `browser.ts`, `expand.ts`, `vercel.ts`.

## What the build enforces

Fails on: an empty, default ("Vite App") or duplicate title; an empty
description; a share image missing from `dist`; a placeholder anywhere in the
entity (555 numbers, "123 Main", lorem, example.com); an empty `<html lang>`;
a `siteUrl` that is not an https origin. Warns on: site-wide description reused,
titles over 70 characters, dynamic routes without `expand`, a `vercel.json`
that rewrites every path to `/`.

## Files

| File | Runs in | Does |
| --- | --- | --- |
| `types.ts` | both | `SiteConfig`, `RouteSeo`, `ResolvedPage`; `vue-router` meta augmentation |
| `resolve.ts` | both | route + context to a `ResolvedPage`: title pattern, 160-char description, noindex, JSON-LD graph |
| `schema.ts` | both | node builders: entity, WebSite, WebPage, Breadcrumb, Article, Product, Event, Service, FAQ, ItemList, Person, CreativeWork |
| `head.ts` | both | `headTags`, `headHtml`, `injectHead` |
| `robots.ts`, `sitemap.ts` | both | robots.txt, sitemap.xml, llms.txt, llms-full.txt |
| `runtime.ts` | browser | `installSeo`, `useSeoData`, `applyPage` |
| `portal.ts` | both | fold the portal's published Search settings into the config and routes |
| `expand.ts`, `prerender.ts`, `browser.ts`, `vercel.ts` | Node | the postbuild step |

## Tests

`npm test` runs the prerender against a fake build and checks every output.
