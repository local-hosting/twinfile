#!/usr/bin/env node
/**
 * Remove retired per-type catalog hubs and orphan package shells (dist-only legacy).
 */
import { existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..')

const LEGACY_CATALOG_TYPES = ['place', 'resource', 'character', 'context', 'story', 'event']

for (const type of LEGACY_CATALOG_TYPES) {
  const dir = join(repoRoot, 'catalog', type)
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true })
    console.log(`removed catalog/${type}/`)
  }
}

for (const pkg of ['core', 'cli', 'bridge', 'simulator']) {
  const dir = join(repoRoot, 'packages', pkg)
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true })
    console.log(`removed packages/${pkg}/`)
  }
}

console.log('prune-legacy-layout ok')