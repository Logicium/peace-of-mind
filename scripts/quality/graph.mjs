// vendored from @apotome/quality 0.1.2: edit apotome-catalog/quality, then re-vendor
/**
 * Unused files: walk the import graph from each package's entry points and list the own source
 * files under src/ that nothing reaches. Imports, dynamic imports, import.meta.glob, new URL(),
 * SCSS @use/@import and "/src/..." path strings (prerender bodyComponent) all count as edges.
 * A file reached only by a path built at runtime will show up here; allow it in the config.
 */
import path from 'node:path'
import { packageRoot, scriptOf } from './files.mjs'

const EXT = ['', '.ts', '.tsx', '.js', '.mjs', '.vue', '.scss', '.css', '/index.ts', '/index.js', '/index.vue']
const ENTRY = /(\.(spec|test|e2e-spec|entity|subscriber|d)\.[a-z]+$|(^|\/)(migrations|seeders|scripts|e2e|test|tests)\/|(^|\/)src\/(main|index|env)\.[a-z]+$|(^|\/)vite\.config\.[a-z]+$|(^|\/)[^/]+\.config\.[cm]?[jt]s$)/

export function unusedFiles(repo) {
  const nodes = new Set(repo.source)
  const aliases = readAliases(repo)
  const resolve = (from, spec) => resolveSpec(repo, nodes, aliases, from, spec)
  const seen = new Set()
  const queue = repo.source.filter((p) => ENTRY.test(p))
  for (const html of repo.tracked.filter((p) => /(^|\/)index\.html$/.test(p))) {
    const base = path.posix.dirname(html)
    for (const m of repo.read(html).matchAll(/(?:src|href)="\/?([^"]+\.(?:ts|js|vue|css|scss))"/g)) queue.push(join(base, m[1]))
  }
  while (queue.length) {
    const p = queue.pop()
    if (seen.has(p) || !nodes.has(p)) continue
    seen.add(p)
    for (const spec of specifiers(p, repo.read(p))) for (const hit of resolve(p, spec)) if (!seen.has(hit)) queue.push(hit)
  }
  return repo.own.filter((p) => /(^|\/)src\//.test(p) && !seen.has(p) && !repo.isTest(p) && !ENTRY.test(p))
}

function specifiers(p, text) {
  const out = []
  const code = p.endsWith('.vue') ? text : scriptOf(p, text).map((b) => b.text).join('\n') || text
  const res = [
    /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]/g,
    /import\s*['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /new URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g,
    /<style[^>]*\ssrc="([^"]+)"/g,
    /['"`](\/?src\/[^'"`]+\.(?:vue|ts|js))['"`]/g,
  ]
  for (const re of res) for (const m of code.matchAll(re)) out.push(m[1])
  // Sass resolves a bare name against the importing file, unlike a script import
  for (const m of code.matchAll(/@(?:use|import|forward)\s+(?:url\()?['"]([^'"]+)['"]/g)) {
    out.push(/^(\.|@|~|\/|sass:|https?:)/.test(m[1]) ? m[1] : `./${m[1]}`)
  }
  // a template literal import is a glob to Vite: import(`../pages/${name}.vue`)
  for (const m of code.matchAll(/import\(\s*`([^`]+)`\s*\)/g)) out.push({ glob: m[1].replace(/\$\{[^}]*\}/g, '*') })
  for (const m of code.matchAll(/import\.meta\.glob(?:Eager)?\(\s*(\[[^\]]*\]|['"][^'"]+['"])/g)) {
    for (const g of m[1].matchAll(/['"]([^'"]+)['"]/g)) out.push({ glob: g[1] })
  }
  return out
}

function resolveSpec(repo, nodes, aliases, from, spec) {
  const pkg = packageRoot(repo, from)
  if (typeof spec === 'object') {
    const base = spec.glob.startsWith('/') ? join(pkg, spec.glob.slice(1)) : spec.glob.startsWith('@/') ? join(pkg, 'src', spec.glob.slice(2)) : join(path.posix.dirname(from), spec.glob)
    const re = globRe(base)
    return [...nodes].filter((n) => re.test(n))
  }
  const clean = spec.replace(/[?#].*$/, '')
  let bases = []
  if (clean.startsWith('.')) bases = [join(path.posix.dirname(from), clean)]
  else if (clean.startsWith('/src/') || clean.startsWith('src/')) bases = [join(pkg, clean.replace(/^\//, ''))]
  else if (clean.startsWith('@/')) bases = [join(pkg, 'src', clean.slice(2))]
  else if (clean.startsWith('~/')) bases = [join(pkg, 'src', clean.slice(2))]
  else for (const [prefix, targets] of aliases) if (clean === prefix || clean.startsWith(`${prefix}/`)) bases.push(...targets.map((t) => join(t, clean.slice(prefix.length))))
  const hits = []
  for (const b of bases) {
    const stem = b.replace(/\.js$/, '')
    const dir = path.posix.dirname(b)
    const name = path.posix.basename(b)
    const tries = [...EXT.map((e) => b + e), ...EXT.map((e) => stem + e), `${dir}/_${name}.scss`, `${dir}/_${name}`, `${b}/_index.scss`]
    const hit = tries.find((t) => nodes.has(t))
    if (hit) hits.push(hit)
  }
  return hits
}

/** tsconfig "paths" from every tracked tsconfig*.json, as [prefix, [target dirs]]. */
function readAliases(repo) {
  const out = []
  for (const f of repo.tracked.filter((p) => /(^|\/)tsconfig[^/]*\.json$/.test(p))) {
    let json
    try { json = JSON.parse(repo.read(f).replace(/\/\*[\s\S]*?\*\/|(^|[^:"])\/\/.*$/gm, '$1').replace(/,(\s*[}\]])/g, '$1')) } catch { continue }
    const opts = json.compilerOptions ?? {}
    const base = join(path.posix.dirname(f), opts.baseUrl ?? '.')
    for (const [k, v] of Object.entries(opts.paths ?? {})) {
      const prefix = k.replace(/\/\*$/, '')
      if (prefix === '@') continue
      out.push([prefix, v.map((t) => join(base, t.replace(/\/?\*$/, '')))])
    }
  }
  return out.sort((a, b) => b[0].length - a[0].length)
}

const join = (...parts) => path.posix.normalize(path.posix.join(...parts)).replace(/^\.\//, '')

function globRe(glob) {
  const body = glob.replace(/[.+^${}()|[\]\\]/g, (c) => (c === '{' || c === '}' ? c : `\\${c}`))
    .replace(/\{([^}]+)\}/g, (_, alt) => `(${alt.split(',').join('|')})`)
    .replace(/\*\*\//g, '(.*/)?').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
  return new RegExp(`^${body}$`)
}
