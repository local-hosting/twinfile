#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(pkgRoot, 'dist')

const indexJs = readFileSync(join(dist, 'index.js'), 'utf8')
const placeJs = readFileSync(join(dist, 'place/index.js'), 'utf8')
const placeDts = readFileSync(join(dist, 'place/index.d.ts'), 'utf8')
const placeMountDts = readFileSync(join(dist, 'place/place/place-mount.d.ts'), 'utf8')
const requiredRuntime = ['resolvePlaceMounts', 'resolvePlaceMount', 'placeMountFromJson', 'placeMountToJson']
const requiredTypes = ['TwinfilePlaceMount', 'PlaceMount']

const haystackJs = `${indexJs}\n${placeJs}`
const storyDts = existsSync(join(dist, 'story/index.d.ts'))
  ? readFileSync(join(dist, 'story/index.d.ts'), 'utf8')
  : ''
const haystackTypes = `${readFileSync(join(dist, 'index.d.ts'), 'utf8')}\n${placeDts}\n${placeMountDts}\n${storyDts}`

const missing = [
  ...requiredRuntime.filter((name) => !haystackJs.includes(name)),
  ...requiredTypes.filter((name) => !haystackTypes.includes(name)),
]
if (missing.length > 0) {
  console.error(`check-npm-export-surface: missing export surface: ${missing.join(', ')}`)
  process.exit(1)
}

const geotypesInstalled =
  existsSync(join(pkgRoot, 'node_modules/@local-hosting/geotypes/package.json')) ||
  existsSync(join(pkgRoot, '../../node_modules/@local-hosting/geotypes/package.json'))
if (!geotypesInstalled) {
  console.error('check-npm-export-surface: @local-hosting/geotypes not installed')
  process.exit(1)
}

console.log('check-npm-export-surface ok')