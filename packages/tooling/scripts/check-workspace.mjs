#!/usr/bin/env node
/**
 * Twinfile repo checks — single publish package under packages/twinfile.
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const twinfilePkg = join(root, 'packages/twinfile')

function runNodeScript(relDir, scriptName) {
  return spawnSync(process.execPath, [join(root, relDir, 'scripts', scriptName)], {
    cwd: join(root, relDir),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

const geotypesRoot = join(root, '../geotypes')
const geotypesScript = join(geotypesRoot, 'scripts/check-all.mjs')

const STEPS = [
  {
    id: 'build',
    run: () =>
      spawnSync(process.execPath, [join(twinfilePkg, 'scripts/build-all.mjs')], {
        cwd: twinfilePkg,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
  },
  ...(existsSync(geotypesScript)
    ? [
        {
          id: 'geotypes',
          run: () =>
            spawnSync(process.execPath, [geotypesScript], {
              cwd: geotypesRoot,
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'pipe'],
            }),
        },
      ]
    : []),
  { id: 'doc-links', run: () => runNodeScript('packages/tooling', 'check-doc-links.mjs') },
  {
    id: 'spec',
    run: () =>
      spawnSync('yarn', ['exec', 'node', 'scripts/check-layout.mjs'], {
        cwd: join(twinfilePkg, 'spec'),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      }),
  },
]

function parseOnly(argv) {
  const idx = argv.indexOf('--only')
  if (idx < 0) return null
  return argv[idx + 1] ?? null
}

const only = parseOnly(process.argv)
const steps = only ? STEPS.filter((s) => s.id === only) : STEPS

let failed = false
for (const step of steps) {
  const result = step.run()
  if (result.status !== 0) {
    failed = true
    process.stderr.write(result.stderr ?? '')
    process.stderr.write(`check-workspace: ${step.id} failed\n`)
  }
}
process.exit(failed ? 1 : 0)