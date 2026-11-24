// vendored from @apotome/quality 0.1.2: edit apotome-catalog/quality, then re-vendor
/**
 * The Apotome Labs quality check: every rule of the Code Quality and Performance Standard that a
 * script can check, run against the repo it is called in.
 *
 *   node scripts/quality/check.mjs [repo-dir] [--types] [--out report.json] [--quiet]
 *
 * Reads quality.config.mjs at the repo root: { mode: 'report' | 'enforce', kind: 'site' | 'app' |
 * 'service', allow: [{ rule, path, why }] }. In report mode it never fails; in enforce mode a
 * Must finding exits 1. A crash in the checker itself never blocks a deploy: it warns and exits 0.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { firstVisit, images, vendoredEdits } from './build.mjs'
import { bigFiles, duplication, fileSize, helperCopies, leftovers, oneLine, rawColours, tests } from './checks.mjs'
import { loadRepo, median, quantile } from './files.mjs'
import { unusedFiles } from './graph.mjs'
import { unusedLocals } from './types.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = (name) => argv.includes(name)
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined)
const root = path.resolve(argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out') ?? '.')

try {
  const report = await run(root)
  const out = opt('--out') ?? (existsSync(path.join(root, 'dist')) ? path.join(root, 'dist', 'quality-report.json') : null)
  if (out) writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`)
  if (!flag('--quiet')) print(report, out)
  if (report.mode === 'enforce' && report.mustFindings > 0) process.exit(1)
} catch (err) {
  console.warn(`[quality] the check itself failed and was skipped: ${err?.stack ?? err}`)
}

async function run(dir) {
  const config = await loadConfig(dir)
  const repo = loadRepo(dir)
  const catalog = [path.resolve(here, '..', '..'), path.resolve(dir, '..', 'apotome-catalog')].find((d) => existsSync(path.join(d, 'seo', 'src')))
  const service = config.kind === 'service'
  const checks = [
    ...fileSize(repo),
    { id: 'unused-files', level: 'must', title: 'Files nothing imports', items: unusedFiles(repo).map((p) => ({ path: p })) },
    flag('--types') ? unusedLocals(repo) : { id: 'unused-locals', level: 'must', title: 'Unused locals and parameters', items: [], skipped: 'run with --types' },
    helperCopies(repo),
    rawColours(repo),
    leftovers(repo),
    vendoredEdits(repo, catalog),
    ...(service ? [] : [firstVisit(repo, config), ...images(repo)]),
    duplication(repo),
    oneLine(repo),
    bigFiles(repo),
    tests(repo),
  ].map((c) => allow(c, config.allow))
  const sizes = repo.own.filter((p) => !repo.isTest(p)).map((p) => repo.lines(p))
  return {
    tool: `@apotome/quality ${version()}`,
    repo: path.basename(dir),
    mode: config.mode,
    kind: config.kind,
    generatedAt: new Date().toISOString(),
    stats: { files: sizes.length, lines: sizes.reduce((a, b) => a + b, 0), median: median(sizes), p90: quantile(sizes, 0.9), vendoredFiles: repo.vendored.size },
    mustFindings: checks.filter((c) => c.level === 'must').reduce((n, c) => n + c.items.length, 0),
    shouldFindings: checks.filter((c) => c.level === 'should').reduce((n, c) => n + c.items.length, 0),
    checks: checks.map((c) => ({ ...c, count: c.items.length })),
  }
}

async function loadConfig(dir) {
  const file = path.join(dir, 'quality.config.mjs')
  const user = existsSync(file) ? (await import(pathToFileURL(file).href)).default : {}
  return { mode: 'report', kind: 'site', allow: [], ...user }
}

function allow(check, rules) {
  const keep = check.items.filter((item) => !rules.some((r) => r.rule === check.id && (item.path === r.path || item.path.startsWith(`${r.path}/`))))
  return { ...check, items: keep, allowed: check.items.length - keep.length }
}

function version() {
  const first = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n')[0]
  const stamped = first.match(/@apotome\/quality (\S+)/)
  if (stamped) return stamped[1]
  const pkg = path.join(here, '..', 'package.json')
  return existsSync(pkg) ? JSON.parse(readFileSync(pkg, 'utf8')).version : 'unknown'
}

function print(report, out) {
  const s = report.stats
  console.log(`[quality] ${report.repo} (${report.mode} mode): ${report.mustFindings} must, ${report.shouldFindings} should`)
  console.log(`[quality] ${s.files} own source files, ${s.lines} lines, median ${s.median}, 90th percentile ${s.p90}`)
  for (const c of report.checks) {
    const extra = c.skipped ? ` (skipped: ${c.skipped})` : c.metric && 'share' in c.metric ? ` (${c.metric.share}% of lines)` : ''
    console.log(`  ${c.level === 'must' ? 'MUST  ' : 'should'} ${String(c.count).padStart(4)}  ${c.title}${extra}`)
  }
  if (out) console.log(`[quality] full report: ${path.relative(process.cwd(), out)}`)
}
