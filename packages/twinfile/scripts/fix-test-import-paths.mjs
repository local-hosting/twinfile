#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const testRoot = join(pkgRoot, 'test')
const depthFromTest = (file) => relative(testRoot, dirname(file)).split('/').filter(Boolean).length

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.test.ts') || name.endsWith('.ts')) out.push(p)
  }
  return out
}

function prefixFor(file) {
  return '../'.repeat(depthFromTest(file) + 1)
}

let n = 0
for (const file of walk(testRoot)) {
  let text = readFileSync(file, 'utf8')
  const pfx = prefixFor(file)
  const next = text
    .replaceAll(/from ['"]\.\.\/\.\.\/\.\.\/packages\/core\/test\/catalog-test-roots\.js['"]/g, `from '${pfx}helpers/catalog-test-roots.js'`)
    .replaceAll(/from ['"]\.\.\/\.\.\/core\/test\/catalog-test-roots\.js['"]/g, `from '${pfx}helpers/catalog-test-roots.js'`)
    .replaceAll(/from ['"](\.\.\/)+src\/([^'"]+)['"]/g, (_m, _dots, tail) => {
      const parts = relative(testRoot, dirname(file)).split('/')
      const area = parts[0] === 'catalog' ? parts[1] : parts[0]
      if (area === 'catalog' && parts[1]) {
        return `from '${pfx}src/catalog/${parts[1]}/${tail.replace(/^src\//, '')}'`
      }
      if (parts[0] === 'simulator' || parts[0] === 'bridge') {
        return `from '${pfx}src/${parts[0]}/${tail.replace(/^src\//, '')}'`
      }
      return `from '${pfx}src/${tail}'`
    })

  if (next !== text) {
    writeFileSync(file, next)
    n += 1
  }
}
console.info(`fix-test-import-paths: updated ${n} file(s)`)