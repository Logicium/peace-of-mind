/// <reference types="vite/client" />

/**
 * The Apotome kit's variables. Optional on purpose: with either missing the
 * kit is inert, so a local build sends nothing and fetches nothing.
 */
interface ImportMetaEnv {
  readonly VITE_APOTOME_API_URL?: string
  readonly VITE_APOTOME_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
