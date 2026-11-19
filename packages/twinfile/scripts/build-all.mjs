#!/usr/bin/env node
/**
 * Build @local-hosting/twinfile from in-repo source trees under src/ (no Yarn sub-packages).
 */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = join(pkgRoot, 'src')

function resolveTscBin() {
  for (const base of [pkgRoot, join(pkgRoot, '..', '..')]) {
    const bin = join(base, 'node_modules', 'typescript', 'bin', 'tsc')
    if (existsSync(bin)) return bin
  }
  throw new Error('[build-all] typescript not found — run yarn install')
}

/** Dependency order — later modules may import earlier ones via dist paths in tsconfig.build.json */
const BUILD_MODULES = [
  { rel: 'bridge', tsconfig: 'tsconfig.build.json' },
  { rel: 'core', tsconfig: 'tsconfig.build.json' },
  { rel: 'catalog/context', tsconfig: 'tsconfig.build.json' },
  { rel: 'catalog/character', tsconfig: 'tsconfig.build.json' },
  { rel: 'catalog/event', tsconfig: 'tsconfig.build.json' },
  { rel: 'catalog/place', tsconfig: 'tsconfig.build.json' },
  { rel: 'catalog/resource', tsconfig: 'tsconfig.build.json' },
  { rel: 'catalog/story', tsconfig: 'tsconfig.build.json' },
  { rel: 'simulator', tsconfig: 'tsconfig.build.json' },
  { rel: 'cli', tsconfig: 'tsconfig.build.json' },
]

for (const mod of BUILD_MODULES) {
  const dir = join(srcRoot, mod.rel)
  const tsconfig = join(dir, mod.tsconfig)
  if (!existsSync(tsconfig)) {
    console.info(`[build-all] skip ${mod.rel} (no ${mod.tsconfig})`)
    continue
  }
  const r = spawnSync(resolveTscBin(), ['-p', mod.tsconfig], {
    cwd: dir,
    stdio: 'inherit',
  })
  if (r.status !== 0) {
    process.exit(r.status ?? 1)
  }
}

const bundle = spawnSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), 'bundle-dist.mjs')], {
  stdio: 'inherit',
})
process.exit(bundle.status ?? 1)