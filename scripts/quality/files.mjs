// vendored from @apotome/quality 0.1.1: edit apotome-catalog/quality, then re-vendor
/**
 * The repo as the checks see it: tracked files (git ls-files, or the folder when a hosted build has no
 * .git), read once, each sorted into
 * own source, vendored source, or something else. Vendored code is measured by its own module,
 * never against the site, so the site is not blamed for lines it did not write.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export const SOURCE = /\.(vue|ts|tsx|js|mjs|cjs|scss|sass|css)$/
const SKIP = /(^|\/)(node_modules|dist|temp|\.vite|coverage|android|ios|public|\.output)\//
const VENDORED_DIR = /(^|\/)src\/kit\//
const STAMP = /^(\/\/|\/\*|<!--) vendored from /
const TEST = /(\.(spec|test)\.[a-z]+$|(^|\/)(__tests__|e2e|cypress|test|tests)\/)/
const EXEMPT_SIZE = /((^|\/)data\/|(^|\/)[^/]*(token|theme|palette|variables)[^/]*\.(s?css|ts)$|\.generated\.)/i

export function loadRepo(root) {
  const tracked = gitFiles(root) ?? walk(root)
  const cache = new Map()
  const read = (p) => {
    if (!cache.has(p)) {
      try { cache.set(p, readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n')) } catch { cache.set(p, '') }
    }
    return cache.get(p)
  }
  const size = (p) => { try { return statSync(path.join(root, p)).size } catch { return 0 } }
  const source = tracked.filter((p) => SOURCE.test(p) && !SKIP.test(p) && !p.endsWith('.d.ts') && !/\.min\./.test(p))
  const vendored = new Set(source.filter((p) => VENDORED_DIR.test(p) || STAMP.test(read(p).slice(0, 120))))
  const own = source.filter((p) => !vendored.has(p))
  const isTest = (p) => TEST.test(p)
  const exemptSize = (p) => EXEMPT_SIZE.test(p)
  return { root, tracked, source, own, vendored, read, size, isTest, exemptSize, lines: (p) => read(p).split('\n').length }
}

function gitFiles(root) {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean)
  } catch {
    return null
  }
}

// Hosted builds (Vercel) check out the files without .git, so the folder itself stands in for the index.
const IGNORED = new Set(['.git', 'node_modules', 'dist', 'temp', '.vite', '.vercel', '.turbo', '.output', 'coverage', 'android', 'ios'])
function walk(root, rel = '', out = []) {
  for (const entry of readdirSync(path.join(root, rel), { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue
    const p = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) walk(root, p, out)
    else out.push(p)
  }
  return out
}

/** The script part of a file: the whole file for .ts/.js, the <script> blocks of a .vue file. */
export function scriptOf(p, text) {
  if (!p.endsWith('.vue')) return /\.(m?[jt]sx?|cjs)$/.test(p) ? [{ text, line: 1 }] : []
  return blocks(text, 'script')
}

/** The style part of a file: the whole file for .css/.scss, the <style> blocks of a .vue file. */
export function styleOf(p, text) {
  if (!p.endsWith('.vue')) return /\.(s?css|sass)$/.test(p) ? [{ text, line: 1 }] : []
  return blocks(text, 'style')
}

function blocks(text, tag) {
  const out = []
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g')
  for (const m of text.matchAll(re)) {
    const start = m.index + m[0].indexOf('>') + 1
    out.push({ text: m[1], line: text.slice(0, start).split('\n').length })
  }
  return out
}

/** Nearest folder at or above `p` that holds a package.json, among tracked files. */
export function packageRoot(repo, p) {
  const roots = repo._pkgRoots ??= new Set(repo.tracked.filter((f) => /(^|\/)package\.json$/.test(f)).map((f) => path.posix.dirname(f)))
  for (let dir = path.posix.dirname(p); ; dir = path.posix.dirname(dir)) {
    if (roots.has(dir)) return dir
    if (dir === '.' || dir === '/') return '.'
  }
}

export const median = (a) => quantile(a, 0.5)
export function quantile(a, q) {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  return s[Math.min(s.length - 1, Math.floor(s.length * q))]
}
