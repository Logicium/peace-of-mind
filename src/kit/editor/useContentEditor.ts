/**
 * useContentEditor - the in-situ editor behind the Apotome editor kit.
 *
 * A standalone port of the archetype editor. The whole thing hangs off
 * one fact: the host site's content lives in a single reactive() object
 * that its components render from. Editing that object updates the page
 * instantly with zero changes to any component.
 *
 * Mechanism: walk the config for editable string leaves, match each value
 * to the DOM element that renders it (TreeWalker over text nodes), make
 * that element contenteditable, and commit on blur (never on input, so
 * re-renders don't yank the caret). setByPath writes the config AND every
 * bound element, so duplicated strings (brand in header + footer) update
 * together. Images match by src and get a floating replace control. Links
 * match by href and get a floating "Edit link" control that opens a small
 * box for the new address.
 *
 * Persistence: full-snapshot draft/publish against apotome-labs-service,
 * authenticated with the client's portal credentials.
 */
import { computed, nextTick, ref } from 'vue'
import { optimizeImage, validateUploadSize } from './imageOptimize'

export interface EditorOptions {
  siteKey: string
  apiUrl: string
  /** the site's single reactive content object */
  config: Record<string, unknown>
}

export interface EditField {
  path: string
  label: string
  value: string
  multiline: boolean
  type: 'text' | 'image' | 'link'
}

const TOKEN_KEY = 'apotome_editor_token'

// module-level singletons shared by the bar + binder
let options: EditorOptions | null = null
const editMode = ref(false)
const dirty = ref<Set<string>>(new Set())
const saving = ref(false)
const saveMsg = ref<string | null>(null)
const authed = ref(false)
const authEmail = ref('')

interface Bound {
  el: HTMLElement
  cleanup: () => void
}
let bound: Bound[] = []
let fileInput: HTMLInputElement | null = null
let imgOverlay: HTMLButtonElement | null = null
let overlayPath: string | null = null
let overlayHideTimer = 0
let linkChip: HTMLButtonElement | null = null
let linkPop: HTMLDivElement | null = null
let chipPath: string | null = null
let chipAnchor: HTMLElement | null = null
let chipHideTimer = 0

const SKIP_KEYS = new Set([
  'theme', 'swatch', 'variant', 'favicon', 'icon', 'src', 'image', 'href', 'url',
  'mapEmbedUrl', 'id', 'slug', 'permalink', 'date', 'scheduleUrl', 'email', 'phone',
])
const URLISH = /^(https?:|\/|data:|mailto:|tel:|#|[\w.-]+\.(jpg|jpeg|png|webp|svg|gif|pdf))/i
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i
const IMAGE_KEY = /(^|_)(src|image|img|photo|logo|cover|thumb|thumbnail|avatar|banner|hero)$/i

function isEditableValue(key: string, val: unknown): val is string {
  if (typeof val !== 'string') return false
  const t = val.trim()
  if (!t || t.length < 2) return false
  if (SKIP_KEYS.has(key)) return false
  if (URLISH.test(t)) return false
  return true
}

function isImageValue(key: string, val: unknown): val is string {
  if (typeof val !== 'string') return false
  const t = val.trim()
  if (!t) return false
  if (t.startsWith('data:image/')) return true
  if (IMAGE_EXT.test(t)) return true
  return IMAGE_KEY.test(key) && (t.startsWith('/') || t.startsWith('http'))
}

/**
 * A link target the client may retarget: an outbound address, an email or a
 * phone number. Paths inside the site are left alone, because those are the
 * site's own structure and pointing one at a page that does not exist breaks
 * navigation rather than a link.
 */
const LINK_VALUE = /^(https?:\/\/|mailto:|tel:)/i
const LINK_SKIP_KEYS = new Set(['mapEmbedUrl', 'permalink', 'canonical'])
const EMAIL_VALUE = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/
const PHONE_VALUE = /^\+?[\d\s().-]{7,}$/

function isLinkValue(key: string, val: unknown): val is string {
  if (typeof val !== 'string') return false
  if (LINK_SKIP_KEYS.has(key)) return false
  return LINK_VALUE.test(val.trim())
}

/**
 * What was typed, as an href. People paste "instagram.com/name", an email
 * address or a phone number; each has one obvious meaning.
 */
export function normalizeLink(raw: string): { value: string; error: string } {
  const s = raw.trim()
  const bad = { value: '', error: 'Enter a web address, an email or a phone number.' }
  if (!s) return bad
  if (/^mailto:/i.test(s) || EMAIL_VALUE.test(s)) {
    const address = s.replace(/^mailto:/i, '')
    return EMAIL_VALUE.test(address) ? { value: `mailto:${address}`, error: '' } : bad
  }
  if (/^tel:/i.test(s) || PHONE_VALUE.test(s)) {
    const digits = s.replace(/^tel:/i, '').replace(/[^\d+]/g, '')
    return digits.length >= 7 ? { value: `tel:${digits}`, error: '' } : bad
  }
  if (/\s/.test(s)) return bad
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return bad
    if (!u.hostname.includes('.')) return bad
    return { value: u.toString(), error: '' }
  } catch {
    return bad
  }
}

/** two hrefs that differ only by a trailing slash are the same link */
function sameHref(a: string, b: string): boolean {
  return a.replace(/\/$/, '') === b.replace(/\/$/, '')
}

function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function prettify(seg: string): string {
  if (/^\d+$/.test(seg)) return `#${Number(seg) + 1}`
  return seg.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function walk(obj: Record<string, unknown>, prefix: string, out: EditField[]): void {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (isImageValue(k, v)) {
      out.push({ path, label: prettify(k), value: v, multiline: false, type: 'image' })
    } else if (isLinkValue(k, v)) {
      out.push({ path, label: prettify(k), value: v, multiline: false, type: 'link' })
    } else if (isEditableValue(k, v)) {
      out.push({ path, label: prettify(k), value: v, multiline: v.length > 70, type: 'text' })
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        const ip = `${path}.${i}`
        if (isImageValue(k, item)) {
          out.push({ path: ip, label: `${prettify(k)} #${i + 1}`, value: item as string, multiline: false, type: 'image' })
        } else if (isLinkValue(k, item)) {
          out.push({ path: ip, label: `${prettify(k)} #${i + 1}`, value: item as string, multiline: false, type: 'link' })
        } else if (isEditableValue(k, item)) {
          out.push({ path: ip, label: `${prettify(k)} #${i + 1}`, value: item as string, multiline: (item as string).length > 70, type: 'text' })
        } else if (item && typeof item === 'object') {
          walk(item as Record<string, unknown>, ip, out)
        }
      })
    } else if (v && typeof v === 'object') {
      walk(v as Record<string, unknown>, path, out)
    }
  }
}

function traverse(root: Record<string, unknown>, path: string): { parent: Record<string, unknown>; key: string } | null {
  const segs = path.split('.')
  let cur: unknown = root
  for (let i = 0; i < segs.length - 1; i++) {
    if (cur == null || typeof cur !== 'object') return null
    cur = (cur as Record<string, unknown>)[segs[i]!]
  }
  if (cur == null || typeof cur !== 'object') return null
  return { parent: cur as Record<string, unknown>, key: segs[segs.length - 1]! }
}

/* ------------------------------- API ------------------------------------- */

function apiBase(): string {
  return (options?.apiUrl ?? '').replace(/\/$/, '')
}

function token(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

async function apiCall<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; message?: string }
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed (${res.status})`)
  }
  return json.data as T
}

/* ------------------------------ composable -------------------------------- */

export function configureEditor(opts: EditorOptions): void {
  options = opts
  authed.value = !!token()
}

export function useContentEditor() {
  const root = computed(() => options?.config ?? null)

  const fields = computed<EditField[]>(() => {
    const out: EditField[] = []
    if (root.value) walk(root.value, '', out)
    return out
  })

  function getByPath(path: string): string {
    const loc = root.value ? traverse(root.value, path) : null
    if (!loc) return ''
    const v = loc.parent[loc.key]
    return typeof v === 'string' ? v : ''
  }

  function setByPath(path: string, value: string): void {
    if (root.value) {
      const loc = traverse(root.value, path)
      if (loc) loc.parent[loc.key] = value
    }
    dirty.value = new Set(dirty.value).add(path)
    if (typeof document === 'undefined') return
    const active = document.activeElement
    document.querySelectorAll<HTMLElement>(`[data-edit-path="${CSS.escape(path)}"]`).forEach((el) => {
      if (el instanceof HTMLImageElement) {
        if (el.getAttribute('src') !== value) el.src = value
      } else if (el !== active && norm(el.innerText) !== norm(value)) {
        el.textContent = value
      }
    })
    // a retargeted link: every anchor bound to it follows at once
    document.querySelectorAll<HTMLElement>(`[data-edit-link-path="${CSS.escape(path)}"]`).forEach((el) => {
      if (el.getAttribute('href') !== value) el.setAttribute('href', value)
    })
  }

  /* in-situ binder */

  function unbind(): void {
    for (const b of bound) {
      b.cleanup()
      b.el.classList.remove('apk-editable', 'apk-editable-img', 'apk-editable-link')
      delete b.el.dataset.editPath
      delete b.el.dataset.editLinkPath
    }
    bound = []
    closeLinkPop()
    if (linkChip) linkChip.style.display = 'none'
    chipPath = null
    chipAnchor = null
    if (imgOverlay) {
      imgOverlay.style.display = 'none'
      overlayPath = null
    }
  }

  function scan(): void {
    unbind()
    if (typeof document === 'undefined') return
    const textToPath = new Map<string, string>()
    const imgToPath = new Map<string, string>()
    const linkToPath = new Map<string, string>()
    for (const f of fields.value) {
      if (f.type === 'image') {
        if (!imgToPath.has(f.value)) imgToPath.set(f.value, f.path)
      } else if (f.type === 'link') {
        if (!linkToPath.has(f.value)) linkToPath.set(f.value, f.path)
      } else {
        const k = norm(f.value)
        if (k.length >= 2 && !textToPath.has(k)) textToPath.set(k, f.path)
      }
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set<HTMLElement>()
    let node: Node | null
    while ((node = walker.nextNode())) {
      const el = node.parentElement
      if (!el || seen.has(el) || el.closest('.apk-bar, .apk-link-pop, .apk-link-chip')) continue
      // textContent first (cheap), then innerText: a heading written as
      // "Built To<br />Specification" has textContent "Built ToSpecification"
      // - no separator - so it could never match its config string. innerText
      // renders the break as whitespace, which norm() collapses to a space.
      const path =
        textToPath.get(norm(el.textContent ?? '')) ?? textToPath.get(norm(el.innerText ?? ''))
      if (path) {
        seen.add(el)
        bindText(el, path)
      }
    }

    if (imgToPath.size) {
      document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
        if (img.closest('.apk-bar') || img.dataset.editPath) return
        const path = matchImage(img, imgToPath)
        if (path) bindImg(img, path)
      })
    }

    if (linkToPath.size) {
      document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
        if (a.closest('.apk-bar, .apk-link-pop') || a.dataset.editLinkPath) return
        const raw = a.getAttribute('href') ?? ''
        for (const [value, path] of linkToPath) {
          if (sameHref(value, raw) || sameHref(value, a.href)) {
            bindLink(a, path)
            break
          }
        }
      })
    }
  }

  function matchImage(img: HTMLImageElement, imgToPath: Map<string, string>): string | null {
    const raw = img.getAttribute('src') ?? ''
    const resolved = img.src
    for (const [value, path] of imgToPath) {
      if (value === raw || value === resolved) return path
      if (resolved.endsWith(value)) return path
      const vf = value.split('/').pop()
      const rf = raw.split('/').pop()
      if (vf && vf === rf) return path
    }
    return null
  }

  function bindText(el: HTMLElement, path: string): void {
    el.dataset.editPath = path
    el.contentEditable = 'plaintext-only'
    el.classList.add('apk-editable')
    const onBlur = () => {
      const txt = norm(el.innerText)
      if (txt !== norm(getByPath(path))) setByPath(path, txt)
    }
    el.addEventListener('blur', onBlur, true)
    bound.push({
      el,
      cleanup: () => {
        el.removeEventListener('blur', onBlur, true)
        el.contentEditable = 'inherit'
      },
    })
  }

  function ensureOverlay(): HTMLButtonElement {
    if (imgOverlay) return imgOverlay
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = 'Replace photo'
    btn.className = 'apk-img-overlay'
    btn.addEventListener('mouseenter', () => window.clearTimeout(overlayHideTimer))
    btn.addEventListener('mouseleave', hideOverlaySoon)
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (overlayPath) replaceImage(overlayPath)
    })
    document.body.appendChild(btn)
    imgOverlay = btn
    return btn
  }

  function showOverlayOver(img: HTMLElement, path: string): void {
    window.clearTimeout(overlayHideTimer)
    overlayPath = path
    const r = img.getBoundingClientRect()
    const btn = ensureOverlay()
    btn.style.left = `${r.left + r.width / 2}px`
    btn.style.top = `${r.top + r.height / 2}px`
    btn.style.display = 'inline-flex'
  }

  function hideOverlaySoon(): void {
    overlayHideTimer = window.setTimeout(() => {
      if (imgOverlay) imgOverlay.style.display = 'none'
      overlayPath = null
    }, 140)
  }

  function bindImg(img: HTMLImageElement, path: string): void {
    img.dataset.editPath = path
    img.classList.add('apk-editable-img')
    const onEnter = () => showOverlayOver(img, path)
    const onLeave = () => hideOverlaySoon()
    img.addEventListener('mouseenter', onEnter)
    img.addEventListener('mouseleave', onLeave)
    bound.push({
      el: img,
      cleanup: () => {
        img.removeEventListener('mouseenter', onEnter)
        img.removeEventListener('mouseleave', onLeave)
      },
    })
  }

  /* links: a chip on hover, a small box for the new address */

  function ensureLinkChip(): HTMLButtonElement {
    if (linkChip) return linkChip
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = 'Edit link'
    btn.className = 'apk-link-chip'
    btn.addEventListener('mouseenter', () => window.clearTimeout(chipHideTimer))
    btn.addEventListener('mouseleave', hideChipSoon)
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (chipPath && chipAnchor) openLinkPop(chipAnchor, chipPath)
    })
    document.body.appendChild(btn)
    linkChip = btn
    return btn
  }

  function showChipOver(a: HTMLElement, path: string): void {
    window.clearTimeout(chipHideTimer)
    if (linkPop) return // a box is open; one thing at a time
    chipPath = path
    chipAnchor = a
    const r = a.getBoundingClientRect()
    const btn = ensureLinkChip()
    btn.style.display = 'inline-flex'
    // Beside the link, at its end: links usually sit in a list, and a chip
    // above one would cover its neighbour. It overlaps the link by a hair so
    // the pointer can travel across without a gap that hides the chip. With
    // no room to the right (a button against the edge) it goes above instead.
    const w = btn.offsetWidth
    const h = btn.offsetHeight
    if (r.right - 3 + w <= window.innerWidth - 8) {
      btn.style.left = `${r.right - 3}px`
      btn.style.top = `${r.top + r.height / 2 - h / 2}px`
    } else {
      const top = r.top - h + 3
      btn.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`
      btn.style.top = `${top < 8 ? r.bottom - 3 : top}px`
    }
  }

  function hideChipSoon(): void {
    chipHideTimer = window.setTimeout(() => {
      if (linkChip) linkChip.style.display = 'none'
      chipPath = null
      chipAnchor = null
    }, 180)
  }

  function closeLinkPop(): void {
    if (!linkPop) return
    linkPop.remove()
    linkPop = null
    document.removeEventListener('mousedown', onDocDown, true)
  }

  function onDocDown(e: MouseEvent): void {
    if (linkPop && !linkPop.contains(e.target as Node)) closeLinkPop()
  }

  function openLinkPop(a: HTMLElement, path: string): void {
    closeLinkPop()
    if (linkChip) linkChip.style.display = 'none'

    const pop = document.createElement('div')
    pop.className = 'apk-link-pop'
    pop.setAttribute('role', 'dialog')
    pop.setAttribute('aria-label', 'Edit link')

    const label = document.createElement('label')
    label.className = 'apk-link-label'
    label.textContent = 'Link goes to'
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'apk-link-input'
    input.value = getByPath(path)
    input.spellcheck = false
    input.autocomplete = 'off'
    input.placeholder = 'example.com/page'
    label.appendChild(input)

    const msg = document.createElement('p')
    msg.className = 'apk-link-msg'
    msg.setAttribute('aria-live', 'polite')

    const row = document.createElement('div')
    row.className = 'apk-link-row'
    const mk = (text: string, cls: string, fn: () => void) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = text
      b.className = cls
      b.addEventListener('click', fn)
      row.appendChild(b)
    }

    const commit = () => {
      const res = normalizeLink(input.value)
      if (res.error) {
        msg.textContent = res.error
        input.focus()
        return
      }
      if (res.value !== getByPath(path)) setByPath(path, res.value)
      closeLinkPop()
    }
    mk('Save', 'apk-link-btn solid', commit)
    mk('Test', 'apk-link-btn', () => {
      const res = normalizeLink(input.value)
      if (res.error) msg.textContent = res.error
      else window.open(res.value, '_blank', 'noopener')
    })
    mk('Cancel', 'apk-link-btn quiet', closeLinkPop)

    input.addEventListener('input', () => (msg.textContent = ''))
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        closeLinkPop()
      }
    })

    pop.append(label, msg, row)
    document.body.appendChild(pop)
    linkPop = pop

    // under the link when there is room, above it when there is not
    const r = a.getBoundingClientRect()
    const w = pop.offsetWidth
    const h = pop.offsetHeight
    const below = r.bottom + 8
    pop.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`
    pop.style.top = `${below + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 8) : below}px`

    input.focus()
    input.select()
    document.addEventListener('mousedown', onDocDown, true)
  }

  function bindLink(a: HTMLAnchorElement, path: string): void {
    a.dataset.editLinkPath = path
    a.classList.add('apk-editable-link')
    const onEnter = () => showChipOver(a, path)
    const onLeave = () => hideChipSoon()
    a.addEventListener('mouseenter', onEnter)
    a.addEventListener('mouseleave', onLeave)
    a.addEventListener('focus', onEnter)
    a.addEventListener('blur', onLeave)
    bound.push({
      el: a,
      cleanup: () => {
        a.removeEventListener('mouseenter', onEnter)
        a.removeEventListener('mouseleave', onLeave)
        a.removeEventListener('focus', onEnter)
        a.removeEventListener('blur', onLeave)
      },
    })
  }

  /**
   * Pick a new image: optimize client-side, try the media endpoint (Blob
   * URL back), fall back to inlining a data URL in the payload.
   */
  function replaceImage(path: string): void {
    if (typeof document === 'undefined' || !options) return
    if (!fileInput) {
      fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = 'image/*'
      fileInput.style.display = 'none'
      document.body.appendChild(fileInput)
    }
    const input = fileInput
    input.value = ''
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      void (async () => {
        try {
          validateUploadSize(file)
          const opt = await optimizeImage(file)
          const uploaded = await apiCall<{ url: string } | null>(
            'POST',
            `/content/${encodeURIComponent(options!.siteKey)}/media`,
            { filename: opt.filename, contentType: opt.contentType, base64: opt.base64 },
          ).catch(() => null)
          setByPath(path, uploaded?.url ?? `data:${opt.contentType};base64,${opt.base64}`)
        } catch (e) {
          window.alert(e instanceof Error ? e.message : String(e))
        }
      })()
    }
    input.click()
  }

  /* mode + persistence */

  function enable(): void {
    editMode.value = true
    document.documentElement.classList.add('apk-editing')
    void nextTick(scan)
  }

  function disable(): void {
    editMode.value = false
    document.documentElement.classList.remove('apk-editing')
    unbind()
  }

  function toggle(): void {
    if (editMode.value) disable()
    else enable()
  }

  async function signIn(email: string, password: string): Promise<void> {
    const data = await apiCall<{ token: string; user: { email: string } }>('POST', '/auth/login', {
      email,
      password,
    })
    try {
      localStorage.setItem(TOKEN_KEY, data.token)
    } catch {
      /* private mode */
    }
    authed.value = true
    authEmail.value = data.user.email
  }

  function signOut(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
    authed.value = false
    disable()
  }

  /**
   * Save a FULL snapshot of the reactive config. The archetype editor once
   * merged per-path onto a fetched draft and silently dropped edits; a
   * deep-clone of the live object is the whole truth.
   */
  async function save(publish: boolean): Promise<void> {
    if (!options || !dirty.value.size || saving.value) return
    saving.value = true
    saveMsg.value = null
    try {
      const payload = JSON.parse(JSON.stringify(options.config)) as Record<string, unknown>
      const path = publish ? 'publish' : 'draft'
      await apiCall(publish ? 'POST' : 'PUT', `/content/${encodeURIComponent(options.siteKey)}/${path}`, { payload })
      dirty.value = new Set()
      saveMsg.value = publish ? 'Published. Live in about a minute.' : 'Draft saved'
      setTimeout(() => (saveMsg.value = null), 3000)
    } catch (e) {
      saveMsg.value = e instanceof Error ? e.message : String(e)
    } finally {
      saving.value = false
    }
  }

  return {
    editMode, dirty, saving, saveMsg, authed, authEmail, fields,
    enable, disable, toggle, signIn, signOut, save, setByPath, getByPath,
  }
}
