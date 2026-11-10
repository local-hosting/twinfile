#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const testCatalog = join(process.cwd(), 'test/catalog')

const TYPE_REWRITES = [
  ['place', '../../../src/'],
  ['event', '../../../src/'],
  ['story', '../../../src/'],
  ['character', '../../../src/'],
  ['context', '../../../src/'],
  ['resource', '../../../src/'],
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.ts')) out.push(p)
  }
  return out
}

function rewriteFile(file, type) {
  let text = readFileSync(file, 'utf8')
  const from = `../../../src/`
  const to = `../../../src/catalog/${type}/`
  if (!text.includes(from)) return false
  const next = text.split(from).join(to)
  if (next === text) return false
  writeFileSync(file, next)
  return true
}

let n = 0
for (const [type] of TYPE_REWRITES) {
  const dir = join(testCatalog, type)
  for (const file of walk(dir)) {
    if (rewriteFile(file, type)) n += 1
  }
}

const storyModule = join(testCatalog, 'story/module.test.ts')
let storyText = readFileSync(storyModule, 'utf8')
const storyFix = storyText.replace(
  "from '../../../src/catalog/story/twin-module.js'",
  "from '../../../src/catalog/story/twin-module.js'",
)
if (storyText.includes("from '../../../src/twin-module.js'")) {
  storyText = storyText.replace(
    "from '../../../src/twin-module.js'",
    "from '../../../src/catalog/story/twin-module.js'",
  )
  writeFileSync(storyModule, storyText)
  n += 1
}

for (const file of walk(join(testCatalog, 'character'))) {
  let text = readFileSync(file, 'utf8')
  const next = text
    .replaceAll('../../../../src/contract/character/', '../../../../src/catalog/character/contract/character/')
    .replaceAll("from '../../../../src/contract/", "from '../../../../src/catalog/character/contract/")
  if (next !== text) {
    writeFileSync(file, next)
    n += 1
  }
}

console.info(`fix-catalog-test-imports: updated ${n} file(s)`)