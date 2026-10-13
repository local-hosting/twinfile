import { statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { RefResolver } from './ref-resolver.js';
import { loadTwinLocalMap, resolveTwinLocalPath, type TwinLocalMap } from './twin-local-map.js';
import { flatTwinfileRef } from '../types/twinfile-ref.js';
import { listFlatExampleUnitNames } from '../paths/examples-catalog.js';
import { resolveTwinfileRoot, resolveTypeExamplesRoot } from '../paths/catalog-layout.js';
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

function versionMatches(manifestVersion: string, refTag: string | undefined): boolean {
  if (!refTag) return true;
  if (manifestVersion === refTag) return true;
  if (/^\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  if (/^\d+\.\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  return false;
}

function parseTwinfileManifestRef(raw: string): { name: string; tag?: string } | undefined {
  const trimmed = raw.trim();
  const body = trimmed.startsWith('twinfile/') ? trimmed.slice('twinfile/'.length) : trimmed;
  if (!body) return undefined;
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

/** Place catalog first, then event units (`catalog/event/examples/<id>`). */
function candidateRoots(name: string, options: TwinfileResolveOptions): string[] {
  const eventRoot = resolveTypeExamplesRoot('event', resolveTwinfileRoot(options.examplesRoot));
  return [...catalogTwinfileRoots(options.examplesRoot, name, options.placeRoot), join(eventRoot, name)];
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
  const name = oci.name ?? parsed.name;
  const tag = oci.tag ?? parsed.tag;

  const localMap = options.twinLocal ?? loadTwinLocalMap(options.examplesRoot);
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

  for (const root of candidateRoots(name, options)) {
    if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) continue;
    const loaded = loadTwinfile(root);
    if (!loaded.ok) continue;
    const version = String(loaded.value.twinfile.version ?? '');
    if (!versionMatches(version, tag)) continue;
    return ok({ ref, loaded: loaded.value });
  }

  return err([
    {
      code: 'E_MISSING_FILE',
      message: `Unit not found for ref ${ref}`,
      hint: 'Searched the place catalog and catalog/event/examples',
    },
  ]);
}

export function resolveRelativeTwinfilePath(from: string, baseRoot: string): string {
  return resolve(baseRoot, from);
}

export function loadTwinfileAtPath(path: string): Result<LoadedTwinfile> {
  return loadTwinfile(path);
}
