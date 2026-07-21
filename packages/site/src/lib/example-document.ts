import { join } from 'node:path'

import { loadTwinfileDocument, resolveSiteExamplesRoot } from '../twinfile-studio/load-twinfile-node'

export function examplesRoot(): string {
  return resolveSiteExamplesRoot()
}

/** Default loader: the unit plus linked `copy: ./…` buildings; `from:` stays a ref only. */
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
