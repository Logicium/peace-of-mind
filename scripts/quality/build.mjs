// vendored from @apotome/quality 0.1.1: edit apotome-catalog/quality, then re-vendor
/**
 * Checks on what the build produced (dist/) and on vendored copies. They read dist as it is on
 * disk, so after `npm run build` they describe that build; without a dist they are skipped.
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

export const BUDGETS = { site: { must: 170, should: 100 }, app: { must: 350, should: 250 } }
const KB = 1024

/** Every dist/index.html in the repo (a monorepo has one per app). */
function dists(repo) {
  const roots = new Set(['.', ...repo.tracked.filter((p) => /(^|\/)package\.json$/.test(p)).map((p) => path.posix.dirname(p))])
  return [...roots].map((r) => path.join(repo.root, r, 'dist')).filter((d) => existsSync(path.join(d, 'index.html')))
}

/** Compressed JavaScript and CSS the first visit to the home page downloads. */
export function firstVisit(repo, config) {
  const budget = BUDGETS[config.kind] ?? BUDGETS.site
  const found = dists(repo)
  if (!found.length) return { id: 'first-visit-js', level: 'must', title: 'First-visit JavaScript within budget', items: [], skipped: 'no dist/ build' }
  const items = []
  const metric = []
  for (const dist of found) {
    const html = readFileSync(path.join(dist, 'index.html'), 'utf8')
    const gz = (re) => [...html.matchAll(re)].reduce((sum, m) => {
      const file = path.join(dist, m[1].replace(/^\//, ''))
      return existsSync(file) ? sum + gzipSync(readFileSync(file)).length : sum
    }, 0)
    const js = Math.round(gz(/<(?:script[^>]*\ssrc|link[^>]*rel="modulepreload"[^>]*\shref)="([^"]+\.js)"/g) / KB)
    const css = Math.round(gz(/<link[^>]*rel="stylesheet"[^>]*\shref="([^"]+\.css)"/g) / KB)
    const days = Math.round((Date.now() - statSync(path.join(dist, 'index.html')).mtimeMs) / 86400000)
    const where = path.relative(repo.root, dist).split(path.sep).join('/')
    metric.push({ dist: where, jsKB: js, cssKB: css, builtDaysAgo: days, budgetKB: budget.must, targetKB: budget.should })
    if (js > budget.must) items.push({ path: where, detail: `${js} KB of JavaScript (budget ${budget.must} KB)` })
  }
  return { id: 'first-visit-js', level: 'must', title: `First-visit JavaScript within ${budget.must} KB`, items, metric }
}

/** Images the site serves: none over 500 KB (must), and the count over 300 KB (should). */
export function images(repo) {
  const found = dists(repo)
  const files = found.length
    ? found.flatMap((d) => walk(d).map((f) => ({ path: path.relative(repo.root, f).split(path.sep).join('/'), bytes: statSync(f).size })))
    : repo.tracked.filter((p) => /(^|\/)public\//.test(p)).map((p) => ({ path: p, bytes: repo.size(p) }))
  const imgs = files.filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f.path)).sort((a, b) => b.bytes - a.bytes)
  const fmt = (f) => ({ path: f.path, detail: `${Math.round(f.bytes / KB)} KB` })
  return [
    { id: 'images-500', level: 'must', title: 'Images over 500 KB', items: imgs.filter((f) => f.bytes > 500 * KB).map(fmt), source: found.length ? 'dist' : 'public' },
    { id: 'images-300', level: 'should', title: 'Images over 300 KB', items: imgs.filter((f) => f.bytes > 300 * KB && f.bytes <= 500 * KB).map(fmt) },
  ]
}

/** Vendored copies that no longer match the hashes their vendor script recorded. */
export function vendoredEdits(repo, catalogDir) {
  const items = []
  for (const m of repo.tracked.filter((p) => /(^|\/)\.catalog\.json$/.test(p))) {
    const manifest = JSON.parse(repo.read(m))
    const dir = path.posix.dirname(m)
    for (const [f, h] of Object.entries(manifest.files)) {
      const text = repo.read(`${dir}/${f}`)
      if (createHash('sha256').update(text).digest('hex').slice(0, 16) !== h) items.push({ path: `${dir}/${f}`, detail: `edited since ${manifest.module} ${manifest.version}` })
    }
  }
  // copies of the SEO module from before it had a manifest: compared with the catalog when it is next door
  const seoSrc = catalogDir && path.join(catalogDir, 'seo', 'src')
  if (seoSrc && existsSync(seoSrc)) {
    for (const p of repo.tracked.filter((f) => /\.ts$/.test(f) && !/version\.ts$/.test(f) && /^\/\* vendored from apotome-seo/.test(repo.read(f)))) {
      const upstream = path.join(seoSrc, path.posix.basename(p))
      if (!existsSync(upstream)) continue
      const body = repo.read(p).replace(/^[^\n]*\n/, '')
      if (body !== readFileSync(upstream, 'utf8').replace(/\r\n/g, '\n')) items.push({ path: p, detail: 'differs from apotome-catalog/seo' })
    }
  }
  return { id: 'vendored-edits', level: 'must', title: 'Vendored files edited inside the site', items }
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}
