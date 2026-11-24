// vendored from @apotome/quality 0.1.0: edit apotome-catalog/quality, then re-vendor
/**
 * The source checks. Each returns { id, level, title, items } where an item is { path, line?, detail }.
 * Levels follow the Code Quality and Performance Standard: 'must' fails an enforcing build,
 * 'should' is reported. Every check reads tracked files only.
 */
import { createHash } from 'node:crypto'
import { scriptOf, styleOf } from './files.mjs'

const MAX_LINES = 600
const COMPONENT_LINES = 300

export function fileSize(repo) {
  const big = repo.own.filter((p) => !repo.exemptSize(p) && !repo.isTest(p)).map((p) => ({ path: p, n: repo.lines(p) }))
  return [
    check('file-size', 'must', `Source files over ${MAX_LINES} lines`, big.filter((f) => f.n > MAX_LINES)),
    check('component-size', 'should', `Components over ${COMPONENT_LINES} lines`, big.filter((f) => f.path.endsWith('.vue') && f.n > COMPONENT_LINES)),
  ]
  function check(id, level, title, list) {
    return { id, level, title, items: list.sort((a, b) => b.n - a.n).map((f) => ({ path: f.path, detail: `${f.n} lines` })) }
  }
}

const HELPERS = [
  'fmtDate', 'formatDate', 'fmtDay', 'formatDay', 'fmtWhen', 'fmtAgo', 'formatAgo', 'timeAgo', 'ago', 'fmtTime', 'formatTime',
  'shortDate', 'money', 'fmtMoney', 'formatMoney', 'formatPrice', 'formatCurrency', 'dollars', 'cents', 'parseCents',
  'esc', 'escape', 'escapeHtml', 'escHtml', 'slugify', 'fmtPhone', 'formatPhone',
]
const HELPER_RE = new RegExp(`(?:\\bfunction\\s+|\\b(?:const|let)\\s+)(${HELPERS.join('|')})\\s*(?:\\(|=\\s*(?:async\\s*)?(?:\\(|[A-Za-z_$][\\w$]*\\s*=>|function))`, 'g')

/** Formatting and escaping helpers defined in the site instead of coming from @apotome/format. */
export function helperCopies(repo) {
  const items = []
  for (const p of repo.own) {
    if (repo.isTest(p)) continue
    for (const block of scriptOf(p, repo.read(p))) {
      for (const m of block.text.matchAll(HELPER_RE)) items.push({ path: p, line: block.line + lineOf(block.text, m.index) - 1, detail: m[1] })
    }
  }
  return { id: 'helper-copies', level: 'must', title: 'Local copies of shared helpers (dates, money, escaping, slugs)', items }
}

const COLOUR = /(#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|\b(?:rgba?|hsla?)\(\s*\d[^)]*\)|\b(?:white|black)\b)/g

/** Raw colour values in component and stylesheet declarations, outside the token partials. */
export function rawColours(repo) {
  const items = []
  for (const p of repo.own) {
    if (repo.exemptSize(p) || /\.svg$/.test(p)) continue
    for (const block of styleOf(p, repo.read(p))) {
      block.text.split('\n').forEach((text, i) => {
        if (/^\s*(\/\/|\/\*|\*)/.test(text)) return
        // a custom property definition (--ink: #111) is a token, wherever it sits; only uses are counted
        const values = [...text.matchAll(/(?:^|[;{\s])([a-z][a-z-]*)\s*:\s*([^;{}]+)/gi)].map((m) => m[2]).join(' ')
        const hits = values.replace(/var\([^)]*\)|url\([^)]*\)/g, '').match(COLOUR)
        if (hits) items.push({ path: p, line: block.line + i, detail: hits.join(' ') })
      })
    }
  }
  return { id: 'raw-colours', level: 'must', title: 'Raw colour values outside the design tokens', items }
}

const LEFTOVER = [
  [/\.(bak|old|orig|tmp|new)$/i, 'backup or scratch file'],
  [/(^|\/)[^/]+\.css\.map$/, 'build output'],
  [/(^|\/)(HelloWorld|TheWelcome|WelcomeItem)\.vue$/, 'starter template file'],
  [/(^|\/)components\/icons\/Icon(Community|Documentation|Ecosystem|Support|Tooling)\.vue$/, 'starter template file'],
  [/(^|\/)src\/stores\/counter\.[jt]s$/, 'starter template store'],
  [/(^|\/)src\/[^/]*(-copy|-old|\.copy)\.[a-z]+$/i, 'copy left beside the original'],
]
const TEMPLATE_README = /(template should help get you started developing with Vue 3|Nest framework TypeScript starter repository|# create-vue)/i

/** Files that should never be committed: backups, scaffold, build output, template READMEs. */
export function leftovers(repo) {
  const items = []
  const tracked = new Set(repo.tracked)
  for (const p of repo.tracked) {
    const hit = LEFTOVER.find(([re]) => re.test(p))
    if (hit) items.push({ path: p, detail: hit[1] })
    else if (/(^|\/)src\/.+\.js$/.test(p) && (tracked.has(p.replace(/\.js$/, '.ts')) || /\.vue\.js$/.test(p))) items.push({ path: p, detail: 'compiled copy beside its source' })
    else if (/(^|\/)README\.md$/.test(p) && TEMPLATE_README.test(repo.read(p))) items.push({ path: p, detail: 'still the starter template README' })
    else if (repo.isTest(p) && /You did it!/.test(repo.read(p))) items.push({ path: p, detail: 'starter template test' })
  }
  return { id: 'leftovers', level: 'must', title: 'Leftover, scaffold and build-output files', items }
}

/** Tracked files over 1 MB outside public/: originals belong in Drive, not git. */
export function bigFiles(repo) {
  const items = repo.tracked.filter((p) => !/(^|\/)public\//.test(p)).map((p) => ({ path: p, bytes: repo.size(p) }))
    .filter((f) => f.bytes > 1024 * 1024).sort((a, b) => b.bytes - a.bytes)
    .map((f) => ({ path: f.path, detail: `${(f.bytes / 1048576).toFixed(1)} MB` }))
  return { id: 'big-files', level: 'should', title: 'Tracked files over 1 MB outside public/', items }
}

/** Share of own source lines that sit in a block of 6 or more lines repeated elsewhere. */
export function duplication(repo) {
  const WINDOW = 6
  const files = repo.own.filter((p) => !repo.isTest(p) && !repo.exemptSize(p) && /\.(vue|ts|js|mjs|scss|css)$/.test(p))
  const seen = new Map()
  const norm = new Map()
  let total = 0
  for (const p of files) {
    const lines = repo.read(p).split('\n').map((t, i) => [t.trim(), i + 1]).filter(([t]) => t.length > 7 && !/^(import|export \{|\/\/|\*|<\/?template>)/.test(t))
    norm.set(p, lines)
    total += lines.length
    for (let i = 0; i + WINDOW <= lines.length; i++) {
      const h = createHash('md5').update(lines.slice(i, i + WINDOW).map(([t]) => t).join('\n')).digest('base64')
      if (!seen.has(h)) seen.set(h, [])
      seen.get(h).push([p, i])
    }
  }
  const dup = new Map()
  const pairs = new Map()
  for (const spots of seen.values()) {
    if (spots.length < 2) continue
    for (const [p, i] of spots) for (let k = 0; k < WINDOW; k++) dup.set(`${p}:${i + k}`, true)
    const key = [...new Set(spots.map(([p]) => p))].sort().join(' + ')
    pairs.set(key, (pairs.get(key) ?? 0) + 1)
  }
  const share = total ? dup.size / total : 0
  const items = [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([key, n]) => ({ path: key, detail: `${n + 5} lines repeated` }))
  return { id: 'duplication', level: 'should', title: 'Repeated blocks of 6+ lines', items, metric: { share: Math.round(share * 1000) / 10, target: 3 } }
}

/** Bracket groups split over several lines that would fit on one line of 120 characters. */
export function oneLine(repo) {
  const items = []
  for (const p of repo.own) {
    if (repo.isTest(p)) continue
    for (const block of scriptOf(p, repo.read(p))) {
      const lines = block.text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const head = lines[i].replace(/\s+$/, '')
        if (!/[([{]$/.test(head) || /\b(function|if|for|while|switch|catch|class|interface|enum|else|try|do)\b|=>\s*\{$|\)\s*\{$|^\s*(type|export type)\b|`/.test(head)) continue
        if (head.endsWith('{') && !/(=|\(|,|:|\[|return)\s*\{$/.test(head)) continue
        const parts = []
        let depth = 1
        let j = i + 1
        for (; j < lines.length && j < i + 10 && depth > 0; j++) {
          const t = lines[j].trim()
          if (/\/\/|\/\*|`|=>\s*\{|[([{]$/.test(t)) { depth = -1; break }
          for (const c of t) depth += '([{'.includes(c) ? 1 : ')]}'.includes(c) ? -1 : 0
          parts.push(t)
        }
        if (depth !== 0 || parts.length < 2) continue
        const close = parts.pop()
        const joined = `${head}${parts.join(' ').replace(/,$/, '')}${close}`.replace(/([([{]) /g, '$1')
        if (joined.length <= 120) items.push({ path: p, line: block.line + i, detail: `${j - i} lines fit in ${joined.length} characters` })
        i = j - 1
      }
    }
  }
  return { id: 'one-line', level: 'should', title: 'Split lines that fit on one line of 120 characters', items }
}

/** Test files, and whether the shared helpers in utils/ have any. */
export function tests(repo) {
  const testFiles = repo.tracked.filter((p) => repo.isTest(p) && /\.(spec|test)\.[a-z]+$/.test(p) && !/node_modules/.test(p))
  const utils = repo.own.filter((p) => /(^|\/)src\/utils\//.test(p))
  const untested = utils.filter((u) => !testFiles.some((t) => t.includes(u.split('/').pop().replace(/\.[a-z]+$/, ''))))
  return { id: 'tests', level: 'should', title: 'Helpers in utils/ without a test file', items: untested.map((p) => ({ path: p })), metric: { testFiles: testFiles.length } }
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length
