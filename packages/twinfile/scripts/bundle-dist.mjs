#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = join(pkgRoot, 'src')
const distRoot = join(pkgRoot, 'dist')

const PARTS = [
  { from: 'bridge/dist', as: 'bridge' },
  { from: 'core/dist', as: 'core' },
  { from: 'catalog/character/dist', as: 'character' },
  { from: 'catalog/context/dist', as: 'context' },
  { from: 'catalog/event/dist', as: 'event' },
  { from: 'catalog/place/dist', as: 'place' },
  { from: 'catalog/resource/dist', as: 'resource' },
  { from: 'catalog/story/dist', as: 'story' },
  { from: 'simulator/dist', as: 'simulator' },
  { from: 'cli/dist', as: 'cli' },
]

function copyPart(relFrom, asName) {
  const abs = join(srcRoot, relFrom)
  if (!existsSync(abs)) {
    console.error(`[bundle-dist] missing build output: src/${relFrom}`)
    process.exit(1)
  }
  const dest = join(distRoot, asName)
  rmSync(dest, { recursive: true, force: true })
  cpSync(abs, dest, { recursive: true })
}

rmSync(distRoot, { recursive: true, force: true })
mkdirSync(distRoot, { recursive: true })

for (const part of PARTS) {
  copyPart(part.from, part.as)
}

const characterLibs = join(srcRoot, 'catalog/character/libs')
if (existsSync(characterLibs)) {
  cpSync(characterLibs, join(distRoot, 'character/libs'), { recursive: true })
}

const fixtureSrc = join(srcRoot, 'core/canvas/canvas/demo-project-content.json')
if (existsSync(fixtureSrc)) {
  const fixtureDest = join(distRoot, 'fixtures')
  mkdirSync(fixtureDest, { recursive: true })
  cpSync(fixtureSrc, join(fixtureDest, 'demo-project-content.json'))
}

const indexJs = `export * from './core/index.js';
export * from './bridge/index.js';
export * from './character/index.js';
export * from './context/index.js';
export * from './event/index.js';
export * from './place/index.js';
export * from './resource/index.js';
export * from './story/index.js';
export * from './simulator/index.js';
`

const browserJs = `export * from './character/contract/character/browser.js';
export * from './story/contract/narrative/browser.js';
export * from './context/contract/browser.js';
`

writeFileSync(join(distRoot, 'index.js'), indexJs)
writeFileSync(
  join(distRoot, 'index.d.ts'),
  indexJs.replace(/\.js/g, '.js'),
)
writeFileSync(join(distRoot, 'bridge.d.ts'), `export * from './bridge/index.js';\n`)
writeFileSync(join(distRoot, 'loro.d.ts'), `export * from './core/views/loro.js';\n`)
writeFileSync(join(distRoot, 'simulator.d.ts'), `export * from './simulator/index.js';\n`)
writeFileSync(join(distRoot, 'browser.js'), browserJs)
writeFileSync(join(distRoot, 'bridge.js'), `export * from './bridge/index.js';\n`)
writeFileSync(join(distRoot, 'loro.js'), `export * from './core/views/loro.js';\n`)
writeFileSync(join(distRoot, 'simulator.js'), `export * from './simulator/index.js';\n`)

const cliTwin = join(distRoot, 'cli/twin.js')
if (!existsSync(cliTwin)) {
  const alt = join(distRoot, 'cli/twinfile-cli.js')
  if (existsSync(alt)) {
    cpSync(alt, cliTwin)
  }
}

/** Avoid ESM cycle when `@local-hosting/twinfile/place` is resolved from a nested install. */
function patchPlaceBarrelCycles() {
  const placeIndexJs = join(distRoot, 'place/index.js')
  if (!existsSync(placeIndexJs)) return
  const replacements = [
    [
      "export { copyRefAlternates } from '@local-hosting/twinfile';",
      "export { copyRefAlternates } from '../core/load/copy-ref-alternates.js';",
    ],
    [
      "export { loadTwinfile } from '@local-hosting/twinfile';",
      "export { loadTwinfile } from '../core/load/load-twinfile.js';",
    ],
  ]
  let js = readFileSync(placeIndexJs, 'utf8')
  for (const [from, to] of replacements) {
    js = js.replace(from, to)
  }
  writeFileSync(placeIndexJs, js)

  const placeIndexDts = join(distRoot, 'place/index.d.ts')
  if (!existsSync(placeIndexDts)) return
  let dts = readFileSync(placeIndexDts, 'utf8')
  dts = dts.replace(
    "export { loadTwinfile, type LoadedTwinfile } from '@local-hosting/twinfile';",
    "export { loadTwinfile, type LoadedTwinfile } from '../core/load/load-twinfile.js';",
  )
  dts = dts.replace(
    "export { copyRefAlternates } from '@local-hosting/twinfile';",
    "export { copyRefAlternates } from '../core/load/copy-ref-alternates.js';",
  )
  writeFileSync(placeIndexDts, dts)
}

patchPlaceBarrelCycles()

console.info('[bundle-dist] ok → packages/twinfile/dist')