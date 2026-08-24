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
 * together. Images match by src and get a floating replace control.
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
  type: 'text' | 'image'
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
    } else if (isEditableValue(k, v)) {
      out.push({ path, label: prettify(k), value: v, multiline: v.length > 70, type: 'text' })
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        const ip = `${path}.${i}`
        if (isImageValue(k, item)) {
          out.push({ path: ip, label: `${prettify(k)} #${i + 1}`, value: item as string, multiline: false, type: 'image' })
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
  }

  /* in-situ binder */

  function unbind(): void {
    for (const b of bound) {
      b.cleanup()
      b.el.classList.remove('apk-editable', 'apk-editable-img')
      delete b.el.dataset.editPath
    }
    bound = []
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
    for (const f of fields.value) {
      if (f.type === 'image') {
        if (!imgToPath.has(f.value)) imgToPath.set(f.value, f.path)
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
      if (!el || seen.has(el) || el.closest('.apk-bar')) continue
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
