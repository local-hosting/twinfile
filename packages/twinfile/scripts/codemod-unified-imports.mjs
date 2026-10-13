#!/usr/bin/env node
/**
 * Replace retired `@local-hosting/twinfile-*` workspace names with `@local-hosting/twinfile` subpaths.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

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
]

const SCAN_DIRS = ['src', 'test', 'spec', '.']
const SCAN_ROOT_FILES = ['README.md']

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'dist' || name === 'node_modules') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|mts|md|mdx|yaml|json)$/.test(name)) out.push(p)
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
for (const rel of SCAN_DIRS) {
  const dir = join(pkgRoot, rel)
  try {
    for (const file of walk(dir)) {
      const before = readFileSync(file, 'utf8')
      const after = rewrite(before)
      if (after !== before) {
        writeFileSync(file, after)
        n += 1
      }
    }
  } catch {
    // optional dir
  }
}
for (const file of SCAN_ROOT_FILES) {
  const p = join(pkgRoot, file)
  try {
    const before = readFileSync(p, 'utf8')
    const after = rewrite(before)
    if (after !== before) {
      writeFileSync(p, after)
      n += 1
    }
  } catch {
    // optional
  }
}

console.info(`codemod-unified-imports: updated ${n} file(s)`)