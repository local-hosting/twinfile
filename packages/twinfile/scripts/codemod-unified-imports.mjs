#!/usr/bin/env node
/**
 * Replace retired `@local-hosting/twinfile-*` workspace names with `@local-hosting/twinfile` subpaths
 * and fix stale monorepo path prose across the twinfile repository.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(pkgRoot, '../..')

const REPLACEMENTS = [
  ['@local-hosting/twinfile-character/module', '@local-hosting/twinfile/character/module'],
  ['@local-hosting/twinfile-context/module', '@local-hosting/twinfile/context/module'],
  ['@local-hosting/twinfile-event/module', '@local-hosting/twinfile/event/module'],
  ['@local-hosting/twinfile-place/module', '@local-hosting/twinfile/place/module'],
  ['@local-hosting/twinfile-resource/module', '@local-hosting/twinfile/resource/module'],
  ['@local-hosting/twinfile-story/module', '@local-hosting/twinfile/story/module'],
  ['@local-hosting/twinfile-character/character', '@local-hosting/twinfile/character'],
  ['@local-hosting/twinfile-context/catalog/', '@local-hosting/twinfile/context/catalog/'],
  ['@local-hosting/twinfile-context/types/', '@local-hosting/twinfile/context/types/'],
  ['@local-hosting/twinfile-core/loro', '@local-hosting/twinfile/loro'],
  ['@local-hosting/twinfile-core/ref', '@local-hosting/twinfile/ref'],
  ['@local-hosting/twinfile-core/cli', '@local-hosting/twinfile/cli'],
  ['@local-hosting/twinfile-core/mcp', '@local-hosting/twinfile/mcp'],
  ['@local-hosting/twinfile-simulator/host', '@local-hosting/twinfile/simulator/host'],
  ['@local-hosting/twinfile-core', '@local-hosting/twinfile'],
  ['@local-hosting/twinfile-bridge', '@local-hosting/twinfile/bridge'],
  ['@local-hosting/twinfile-simulator', '@local-hosting/twinfile/simulator'],
  ['@local-hosting/twinfile-place', '@local-hosting/twinfile/place'],
  ['@local-hosting/twinfile-character', '@local-hosting/twinfile/character'],
  ['@local-hosting/twinfile-context', '@local-hosting/twinfile/context'],
  ['@local-hosting/twinfile-story', '@local-hosting/twinfile/story'],
  ['@local-hosting/twinfile-event', '@local-hosting/twinfile/event'],
  ['@local-hosting/twinfile-resource', '@local-hosting/twinfile/resource'],
  ['packages/core/src/paths/catalog-layout.ts', 'packages/twinfile/src/core/paths/catalog-layout.ts'],
  ['packages/spec/', 'packages/twinfile/spec/'],
  ['yarn workspace @local-hosting/twinfile-cli build', 'yarn workspace @local-hosting/twinfile build'],
]

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.yarn',
  '.git',
  'yarn.lock',
])

const SCAN_ROOTS = [
  join(repoRoot, 'packages/twinfile'),
  join(repoRoot, 'packages/site'),
  join(repoRoot, 'packages/tooling'),
  join(repoRoot, 'packages/twinfile/src/workbench'),
  join(repoRoot, 'catalog'),
  repoRoot,
]

const FILE_RE = /\.(ts|tsx|mts|js|mjs|md|mdx|yaml|yml|json)$/

function walk(dir, out = []) {
  let names
  try {
    names = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of names) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    let st
    try {
      st = statSync(p)
    } catch {
      continue
    }
    if (st.isDirectory()) walk(p, out)
    else if (FILE_RE.test(name)) out.push(p)
  }
  return out
}

function rewrite(text) {
  let out = text
  for (const [from, to] of REPLACEMENTS) {
    out = out.split(from).join(to)
  }
  return out
}

let n = 0
const seen = new Set()
for (const root of SCAN_ROOTS) {
  for (const file of walk(root)) {
    if (seen.has(file)) continue
    seen.add(file)
    const before = readFileSync(file, 'utf8')
    const after = rewrite(before)
    if (after !== before) {
      writeFileSync(file, after)
      n += 1
    }
  }
}

console.info(`codemod-unified-imports: updated ${n} file(s)`)