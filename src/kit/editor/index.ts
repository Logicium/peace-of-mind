/**
 * Apotome editor kit - entry point.
 *
 * Vendor the whole `editor/` folder into a client site's `src/kit/` and
 * wire two things in `main.ts`:
 *
 *   import { reactive } from 'vue'
 *   import { loadPublishedContent, applyDeep, initApotomeEditor } from '@/kit/editor'
 *   import { siteData } from '@/data/site'      // must be reactive()
 *
 *   const overlay = await loadPublishedContent({ siteKey, apiUrl })
 *   if (overlay) applyDeep(siteData, overlay)   // published edits win
 *   initApotomeEditor({ siteKey, apiUrl, config: siteData })
 *
 * The editor bar mounts as its OWN tiny Vue app appended to <body>, so it
 * never interferes with the host app. It appears only when the URL
 * contains `#edit` (or an editor session already exists), so visitors
 * never see it. The one requirement on the site: content must live in a
 * single `reactive()` object its components render from.
 */
import { createApp } from 'vue'
import { configureEditor, type EditorOptions } from './useContentEditor'

export { optimizeImage, validateUploadSize } from './imageOptimize'
export type { EditorOptions } from './useContentEditor'

/** Fetch the published content overlay for a site (null when none). */
export async function loadPublishedContent(opts: { siteKey: string; apiUrl: string }): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${opts.apiUrl.replace(/\/$/, '')}/api/content/${encodeURIComponent(opts.siteKey)}`)
    const json = (await res.json()) as { success?: boolean; data?: Record<string, unknown> | null }
    return json?.data ?? null
  } catch {
    return null
  }
}

/**
 * Write overlay values into the live reactive config, leaf by leaf, so
 * every component re-renders without knowing anything happened. Guards
 * against shape drift: never replaces an array with an object or vice
 * versa (the archetype splash-screen bug).
 *
 * Everything is patched IN PLACE, arrays included. Replacing an array
 * would orphan any module-level alias a site keeps to it (`export const
 * services = content.services`): the alias would go on pointing at the
 * defaults while the overlay landed on a new array nobody renders. That
 * is exactly how published edits once looked saved but never showed up
 * for visitors.
 */
export function applyDeep(target: Record<string, unknown>, patch: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(patch)) {
    const cur = target[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (cur && typeof cur === 'object' && !Array.isArray(cur)) {
        applyDeep(cur as Record<string, unknown>, v as Record<string, unknown>)
      } else if (cur === undefined) {
        target[k] = v
      }
      // array<-object mismatch: keep the site's shape
    } else if (Array.isArray(v)) {
      if (Array.isArray(cur)) applyArray(cur, v)
      else if (cur === undefined) target[k] = v
      // object<-array mismatch: keep the site's shape
    } else {
      target[k] = v
    }
  }
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/**
 * A stable identity for an array item, so source and overlay can be paired
 * by *what* an item is rather than where it happens to sit.
 */
function itemKey(v: unknown): string | null {
  if (!isPlainObject(v)) return null
  for (const k of ['slug', 'id', 'key']) {
    const val = v[k]
    if (typeof val === 'string' && val) return `${k}:${val}`
  }
  return null
}

/**
 * Patch an array in place.
 *
 * The contract: the SITE'S SOURCE owns an array's structure - its length and
 * order - and the overlay only supplies leaf values for items that still
 * exist. That split is what makes a published snapshot safe to keep applying
 * while the code keeps evolving.
 *
 * Items are paired by a stable `slug`/`id` when both sides carry one, falling
 * back to position when they do not. Three bugs die here, all of which
 * presented as "the client's edits are fine but MY change did nothing":
 *
 *   - adding an item in code no longer has it truncated away by an older,
 *     shorter snapshot (the old code ended with `target.length = patch.length`)
 *   - removing an item in code no longer has it resurrected from the snapshot
 *   - inserting or reordering items no longer slides every saved edit after
 *     the change onto the wrong item
 */
function applyArray(target: unknown[], patch: unknown[]): void {
  const keyed = new Map<string, unknown>()
  for (const p of patch) {
    const k = itemKey(p)
    if (k) keyed.set(k, p)
  }

  for (let i = 0; i < target.length; i++) {
    const cur = target[i]
    const ck = itemKey(cur)
    // identity match when available; otherwise same-position match
    const v = ck ? keyed.get(ck) : patch[i]
    if (v === undefined) continue // nothing published for this item: keep the default

    if (isPlainObject(v) && isPlainObject(cur)) {
      applyDeep(cur, v)
    } else if (Array.isArray(v) && Array.isArray(cur)) {
      applyArray(cur, v)
    } else if (!isPlainObject(cur) && !Array.isArray(cur)) {
      target[i] = v // leaf (string in a string[])
    }
    // shape drift: keep the site's shape
  }
}

const TOKEN_KEY = 'apotome_editor_token'

/**
 * The portal's Edit button lands here carrying `?edit&apk=<ticket>`: a
 * two-minute pass minted for whoever pressed it. Trading it for a real
 * session BEFORE the bar mounts is what makes the button one click instead
 * of "now sign in again on your own site". The ticket is stripped from the
 * address bar either way, so it never survives into a copied link, and an
 * expired one simply falls back to the bar's ordinary sign-in form.
 */
async function redeemHandoffTicket(apiUrl: string): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const ticket = params.get('apk')
  if (!ticket) return

  params.delete('apk')
  const rest = params.toString()
  const clean =
    window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash
  window.history.replaceState(window.history.state, '', clean)

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/auth/editor-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket }),
    })
    const json = (await res.json()) as { success?: boolean; data?: { token?: string } }
    if (json?.success && json.data?.token) {
      localStorage.setItem(TOKEN_KEY, json.data.token)
    }
  } catch {
    /* expired or offline: the sign-in form is still right there */
  }
}

/** Mount the editor bar when appropriate. Safe to call unconditionally. */
export function initApotomeEditor(options: EditorOptions): void {
  if (typeof window === 'undefined') return
  if (!options.siteKey || !options.apiUrl) return

  const hasTicket = /[?&]apk=/.test(window.location.search)
  const wantsEditor =
    hasTicket ||
    /[?&#]edit\b/.test(window.location.href) ||
    (() => {
      try {
        return !!localStorage.getItem(TOKEN_KEY)
      } catch {
        return false
      }
    })()
  if (!wantsEditor) return

  configureEditor(options)
  const ready = hasTicket ? redeemHandoffTicket(options.apiUrl) : Promise.resolve()
  void ready.then(() => import('./EditorBar.vue')).then((mod) => {
    const host = document.createElement('div')
    // Stable hook so a host site can hide the bar on pages where chrome is
    // unwelcome (a fullscreen deck, a kiosk view) without unmounting it.
    host.className = 'apotome-editor-host'
    document.body.appendChild(host)
    createApp(mod.default).mount(host)
  })
}
