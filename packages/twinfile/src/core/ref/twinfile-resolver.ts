import { statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { RefResolver } from './ref-resolver.js';
import { loadTwinLocalMap, mergeTwinLocalMaps, resolveTwinLocalPath, type TwinLocalMap } from './twin-local-map.js';
import { flatTwinfileRef } from '../types/twinfile-ref.js';
import { flatExampleUnitDir, listFlatExampleUnitNames } from '../paths/examples-catalog.js';
import {
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
  type TwinCatalogType,
} from '../paths/catalog-layout.js';
import { isTwinfileOverlayPackRoot, overlayPackUnitDir } from '../paths/list-pack-units.js';
import { loadTwinfile, type LoadedTwinfile } from '../load/load-twinfile.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';

export type TwinfileResolveOptions = {
  examplesRoot: string;
  /** Parent place when resolving from a scenario. */
  placeRoot?: string;
  twinLocal?: TwinLocalMap;
};

export type ResolvedTwinfileRef = {
  ref: string;
  loaded: LoadedTwinfile;
};

const CATALOG_TYPES: TwinCatalogType[] = [
  'place',
  'character',
  'context',
  'story',
  'event',
  'resource',
];

function versionMatches(manifestVersion: string, refTag: string | undefined): boolean {
  if (!refTag) return true;
  if (manifestVersion === refTag) return true;
  if (/^\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  if (/^\d+\.\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  return false;
}

function parseTwinfileManifestRef(raw: string): { kind?: string; name: string; tag?: string } | undefined {
  const trimmed = raw.trim();
  const body = trimmed.startsWith('twinfile/') ? trimmed.slice('twinfile/'.length) : trimmed;
  if (!body) return undefined;
  const slash = body.indexOf('/');
  if (slash > 0) {
    const kind = body.slice(0, slash);
    const rest = body.slice(slash + 1);
    const colon = rest.lastIndexOf(':');
    if (colon <= 0) return { kind, name: rest };
    return { kind, name: rest.slice(0, colon), tag: rest.slice(colon + 1) };
  }
  const colon = body.lastIndexOf(':');
  if (colon <= 0) return { name: body };
  return { name: body.slice(0, colon), tag: body.slice(colon + 1) };
}

function catalogTwinfileRoots(catalogRoot: string, name: string, placeRoot?: string): string[] {
  const roots: string[] = [];
  roots.push(join(catalogRoot, name));
  if (placeRoot) roots.push(join(placeRoot, 'scenarios', name));
  roots.push(join(catalogRoot, 'scenarios', name));
  for (const place of listFlatExampleUnitNames(catalogRoot)) {
    roots.push(join(catalogRoot, place, 'scenarios', name));
  }
  return roots;
}

/** Overlay pack, monorepo catalogs, legacy flat/scenario paths, then event examples. */
function candidateRoots(
  parsed: { kind?: string; name: string },
  options: TwinfileResolveOptions,
): string[] {
  const packRoot = resolve(options.examplesRoot);
  const twinfileRoot = resolveTwinfileRoot(packRoot);
  const roots: string[] = [];
  if (parsed.kind && isTwinfileOverlayPackRoot(packRoot)) {
    roots.push(overlayPackUnitDir(packRoot, parsed.kind as TwinCatalogType, parsed.name));
  }
  const types = parsed.kind ? [parsed.kind as TwinCatalogType] : CATALOG_TYPES;
  for (const type of types) {
    if (!CATALOG_TYPES.includes(type)) continue;
    const catalog = resolveTypeExamplesRoot(type, twinfileRoot);
    roots.push(flatExampleUnitDir(catalog, parsed.name));
  }
  roots.push(...catalogTwinfileRoots(packRoot, parsed.name, options.placeRoot));
  const eventRoot = resolveTypeExamplesRoot('event', twinfileRoot);
  roots.push(join(eventRoot, parsed.name));
  return roots;
}

export function resolveTwinfileByRef(
  ref: string,
  options: TwinfileResolveOptions,
): Result<ResolvedTwinfileRef> {
  const parsed = parseTwinfileManifestRef(ref.startsWith('twinfile/') ? ref : `twinfile/${ref}`);
  if (!parsed) {
    return err([{ code: 'E_MISSING_FILE', message: `Invalid unit ref: ${ref}` }]);
  }

  const resolver = new RefResolver();
  const oci = resolver.resolve(ref.includes('/') ? ref : `twinfile/${ref}`);
  const tag = oci.tag ?? parsed.tag;

  const packRoot = resolve(options.examplesRoot);
  const twinfileRoot = resolveTwinfileRoot(packRoot);
  const localMap =
    options.twinLocal ?? mergeTwinLocalMaps(loadTwinLocalMap(twinfileRoot), loadTwinLocalMap(packRoot));
  const localRef = flatTwinfileRef(ref.includes('/') ? ref : `twinfile/${ref}`);

  const localPath =
    resolveTwinLocalPath(localRef, localMap) ?? resolveTwinLocalPath(ref, localMap);
  if (localPath && statSync(localPath, { throwIfNoEntry: false })?.isDirectory()) {
    const loaded = loadTwinfile(localPath);
    if (loaded.ok) {
      const version = String(loaded.value.twinfile.version ?? '');
      if (versionMatches(version, tag)) {
        return ok({ ref, loaded: loaded.value });
      }
    }
  }

  for (const root of candidateRoots(parsed, options)) {
    if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) continue;
    const loaded = loadTwinfile(root);
    if (!loaded.ok) continue;
    const version = String(loaded.value.twinfile.version ?? '');
    if (!versionMatches(version, tag)) continue;
    if (parsed.kind) {
      const kind = String(loaded.value.twinfile.kind ?? '').trim();
      if (kind && kind !== parsed.kind) continue;
    }
    return ok({ ref, loaded: loaded.value });
  }

  return err([
    {
      code: 'E_MISSING_FILE',
      message: `Unit not found for ref ${ref}`,
      hint: 'Searched overlay pack, monorepo catalogs, and catalog/event/examples',
    },
  ]);
}

export function resolveRelativeTwinfilePath(from: string, baseRoot: string): string {
  return resolve(baseRoot, from);
}

export function loadTwinfileAtPath(path: string): Result<LoadedTwinfile> {
  return loadTwinfile(path);
}
