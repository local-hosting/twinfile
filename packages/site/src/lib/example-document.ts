import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { loadTwinfileDocument } from '../twinfile-studio/load-twinfile-node'

function discoverPlaceExamplesRoot(): string {
  const fromEnv = process.env.TF_EXAMPLES_ROOT?.trim()
  if (fromEnv) return fromEnv

  let dir = process.cwd()
  for (let depth = 0; depth < 12; depth += 1) {
    const catalogPlace = join(dir, 'catalog', 'place', 'examples')
    if (existsSync(join(catalogPlace, 'twin.local.yaml'))) {
      return catalogPlace
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error('loadExampleDocument: set TF_EXAMPLES_ROOT')
}

export function examplesRoot(): string {
  return discoverPlaceExamplesRoot()
}

/** Default loader: the unit plus linked `with:` mixins and `copy: ./…` buildings; `from:` stays a ref only. */
export function loadExampleDocument(uri: string): string {
  const root = examplesRoot()
  const target = uri.startsWith('twinfile/') ? uri : join(root, uri)
  return loadTwinfileDocument(target, { examplesRoot: root })
}

/** Load a catalog unit when the ref exists. Otherwise return the fence text. */
export function exampleText(uri: string, fallback: string): string {
  try {
    return loadExampleDocument(uri)
  } catch {
    return fallback
  }
}