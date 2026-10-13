/**
 * The Apotome SEO kit.
 *
 * Vendor this folder into a client site at `src/kit/seo/`, add the postbuild
 * script, and the search settings the client edits in their portal become the
 * site's titles, descriptions, share cards, structured data, sitemap and
 * robots.txt on the next build.
 *
 * `stamp.ts` is deliberately not re-exported here: it imports `node:fs`, and
 * pulling it into the browser bundle through a barrel would break the build
 * of every site that imports anything else from this folder.
 */

export * from './types'
export * from './head'
export * from './sitemap'
export * from './fetchSeo'
export * from './useSeo'
