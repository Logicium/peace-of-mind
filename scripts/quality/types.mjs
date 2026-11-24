// vendored from @apotome/quality 0.1.0: edit apotome-catalog/quality, then re-vendor
/**
 * Unused locals and parameters, from the project's own TypeScript (or vue-tsc) with the two
 * unused-code flags switched on for this run only. Slow, so it runs with --types, not in every
 * build. It needs node_modules; a repo without them is skipped, never compiled another way.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const CODES = /error TS(6133|6138|6192|6196|6198|6199|6205):/

export function unusedLocals(repo) {
  const items = []
  const roots = new Set(['.', ...repo.tracked.filter((p) => /(^|\/)package\.json$/.test(p)).map((p) => path.posix.dirname(p))])
  let ran = 0
  for (const r of roots) {
    const dir = path.join(repo.root, r)
    const config = ['tsconfig.app.json', 'tsconfig.json'].find((c) => existsSync(path.join(dir, c)))
    if (!config) continue
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    const bin = deps['vue-tsc'] ? 'node_modules/vue-tsc/bin/vue-tsc.js' : 'node_modules/typescript/bin/tsc'
    const binPath = [dir, repo.root].map((d) => path.join(d, bin)).find(existsSync)
    if (!binPath) continue
    const run = spawnSync(process.execPath, [binPath, '--noEmit', '-p', config, '--noUnusedLocals', '--noUnusedParameters'], { cwd: dir, encoding: 'utf8', timeout: 300000, maxBuffer: 1 << 26 })
    ran++
    for (const line of `${run.stdout}\n${run.stderr}`.split('\n')) {
      const m = line.match(/^(.+?)\((\d+),\d+\): (error TS\d+: .+)$/)
      if (!m || !CODES.test(line)) continue
      const file = path.posix.join(r, m[1].replace(/\\/g, '/')).replace(/^\.\//, '')
      if (repo.vendored.has(file)) continue
      items.push({ path: file, line: Number(m[2]), detail: m[3].replace(/^error TS\d+: /, '') })
    }
  }
  return { id: 'unused-locals', level: 'must', title: 'Unused locals and parameters', items, ...(ran ? {} : { skipped: 'no TypeScript in node_modules' }) }
}
