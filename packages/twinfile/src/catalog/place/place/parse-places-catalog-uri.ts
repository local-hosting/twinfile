import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { resolveExamplesRoot } from '@local-hosting/twinfile';

export type ParsedPlacesCatalog =
  | { kind: 'file'; rootDir: string }
  | { kind: 'oci'; registry: string; repositoryPrefix?: string };

function fileRootFromUri(uri: string): string | undefined {
  const trimmed = uri.trim();
  if (trimmed.startsWith('file://')) {
    return resolve(fileURLToPath(trimmed));
  }
  if (trimmed.startsWith('/') || trimmed.startsWith('.')) {
    return resolve(trimmed);
  }
  return undefined;
}

/** Parse a host places catalog URI (`file://…`, local path, or `oci://registry[/namespace]`). */
export function parsePlacesCatalogUri(uri: string): ParsedPlacesCatalog {
  const trimmed = uri.trim();
  if (trimmed.startsWith('oci://')) {
    const rest = trimmed.slice('oci://'.length);
    const slash = rest.indexOf('/');
    if (slash < 0) {
      return { kind: 'oci', registry: rest.replace(/\/$/, '') };
    }
    const registry = rest.slice(0, slash);
    const repositoryPrefix = rest.slice(slash + 1).replace(/\/$/, '') || undefined;
    return { kind: 'oci', registry, repositoryPrefix };
  }

  const fileRoot = fileRootFromUri(trimmed);
  if (fileRoot) {
    if (!statSync(fileRoot, { throwIfNoEntry: false })?.isDirectory()) {
      throw new Error(`parsePlacesCatalogUri: not a directory: ${fileRoot}`);
    }
    return { kind: 'file', rootDir: fileRoot };
  }

  throw new Error(
    `parsePlacesCatalogUri: unsupported URI (use file://…, a directory path, or oci://registry[/namespace])`,
  );
}

export type PlacesCatalogResolveInput = {
  placesCatalogUri?: string;
};

/** Resolve catalog from an explicit URI, else the monorepo place catalog. */
export function resolvePlacesCatalog(
  input: PlacesCatalogResolveInput = {},
): ParsedPlacesCatalog | undefined {
  const fromUri = input.placesCatalogUri?.trim();
  if (fromUri) {
    return parsePlacesCatalogUri(fromUri);
  }
  const examplesRoot = resolveExamplesRoot();
  return examplesRoot ? { kind: 'file', rootDir: examplesRoot } : undefined;
}
