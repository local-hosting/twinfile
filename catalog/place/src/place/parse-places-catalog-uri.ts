import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

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

/** Resolve catalog from explicit URI, env, or legacy examples root. */
export function resolvePlacesCatalog(
  input: PlacesCatalogResolveInput = {},
): ParsedPlacesCatalog | undefined {
  const fromUri = input.placesCatalogUri?.trim() || process.env.TF_PLACES_CATALOG_URI?.trim();
  if (fromUri) {
    return parsePlacesCatalogUri(fromUri);
  }
  const examplesRoot = process.env.TF_EXAMPLES_ROOT?.trim();
  if (examplesRoot && statSync(examplesRoot, { throwIfNoEntry: false })?.isDirectory()) {
    return { kind: 'file', rootDir: resolve(examplesRoot) };
  }
  return undefined;
}
