/**
 * One place that knows what the kit's environment variables are called.
 *
 * `VITE_APOTOME_SITE_KEY` and `VITE_APOTOME_API_URL` are canonical. The older
 * names are still read as fallbacks, because sites are already deployed with
 * them and a rename that needs every one of them redeployed on the same day is
 * a rename that half happens.
 *
 * The Apotome-prefixed names are checked first on purpose. A site with its own
 * backend already owns `VITE_API_URL`, and pointing the kit at that would send
 * form submissions to the wrong service; Bear Creek and Red Feather namespace
 * theirs for exactly this reason.
 *
 * Returning null when either half is missing is what makes every kit module
 * inert by default: local dev and unprovisioned deployments send nothing and
 * fetch nothing, without a single flag to remember.
 */

export interface KitEnv {
  siteKey: string
  apiUrl: string
}

type EnvBag = Record<string, string | boolean | undefined>

export function resolveKitEnv(env: EnvBag = import.meta.env as unknown as EnvBag): KitEnv | null {
  const siteKey = str(env.VITE_APOTOME_SITE_KEY) ?? str(env.VITE_ANALYTICS_SITE_KEY)
  const apiUrl = str(env.VITE_APOTOME_API_URL) ?? str(env.VITE_API_URL)
  if (!siteKey || !apiUrl) return null
  return { siteKey, apiUrl: apiUrl.replace(/\/$/, '') }
}

/**
 * Resolves an override pair against the environment.
 *
 * Every kit entry point takes optional siteKey/apiUrl so a site can pass them
 * explicitly (tests, a second tenant on one build) without the caller having to
 * know the variable names.
 */
export function kitEnvWith(opts?: { siteKey?: string; apiUrl?: string }): KitEnv | null {
  const base = resolveKitEnv()
  const siteKey = opts?.siteKey ?? base?.siteKey
  const apiUrl = opts?.apiUrl ?? base?.apiUrl
  if (!siteKey || !apiUrl) return null
  return { siteKey, apiUrl: apiUrl.replace(/\/$/, '') }
}

function str(v: string | boolean | undefined): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}
