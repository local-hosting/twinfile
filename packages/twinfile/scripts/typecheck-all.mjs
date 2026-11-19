#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const r = spawnSync(process.execPath, [join(pkgRoot, 'scripts/build-all.mjs')], {
  cwd: pkgRoot,
  stdio: 'inherit',
})
process.exit(r.status ?? 1)