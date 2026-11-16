import { statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { RefResolver } from './ref-resolver.js';
import { loadTwinLocalMapMerged, resolveTwinLocalPath } from './twin-local-map.js';
import { flatTwinfileRef } from '../types/twinfile-ref.js';
import { listFlatExampleUnitNames } from '../paths/examples-catalog.js';
import { resolveSimulatorRoot } from '../paths/catalog-layout.js';
import { loadTwinfile, type LoadedTwinfile } from '../load/load-twinfile.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import type { CatalogTwinfileResolver } from './catalog-twinfile-hook.js';
import { resolveViaCatalogHook } from './catalog-twinfile-hook.js';

export type TwinfileResolveOptions = {
  examplesRoot: string;
  /** Place event catalog root (`@doppler-group/twinfile-simulator`); defaults from `TF_TWINFILE_ROOT`. */
  simulatorRoot?: string;
  /** Parent place when resolving from a scenario. */
  placeRoot?: string;
  twinLocal?: ReturnType<typeof loadTwinLocalMapMerged>;
  /** Overrides default catalog resolver from `registerCatalogTwinfileResolver`. */
  resolveCatalogTwinfile?: CatalogTwinfileResolver;
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
  roots.push(join(catalogRoot, 'places', name));
  roots.push(join(catalogRoot, 'bases', name));
  roots.push(join(catalogRoot, 'mixins', name));
  roots.push(join(catalogRoot, 'templates', 'place', name));
  roots.push(join(catalogRoot, 'templates', name));
  if (placeRoot) {
    roots.push(join(placeRoot, 'events', name));
    roots.push(join(placeRoot, 'scenarios', name));
  }
  roots.push(join(catalogRoot, 'situations', name));
  roots.push(join(catalogRoot, 'scenarios', name));
  for (const place of listFlatExampleUnitNames(catalogRoot)) {
    roots.push(join(catalogRoot, place, 'events', name));
    roots.push(join(catalogRoot, place, 'scenarios', name));
  }
  return roots;
}

function simulatorCatalogRoot(options: TwinfileResolveOptions, examplesRoot: string): string | undefined {
  return options.simulatorRoot ?? resolveSimulatorRoot(examplesRoot);
}

function candidateRoots(name: string, options: TwinfileResolveOptions): string[] {
  const simulatorRoot = simulatorCatalogRoot(options, options.examplesRoot);
  const roots = catalogTwinfileRoots(options.examplesRoot, name, options.placeRoot);
  if (simulatorRoot) {
    roots.push(...catalogTwinfileRoots(simulatorRoot, name, options.placeRoot));
  }
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
  const name = oci.name ?? parsed.name;
  const tag = oci.tag ?? parsed.tag;

  const simulatorRoot = simulatorCatalogRoot(options, options.examplesRoot);
  const localMap =
    options.twinLocal ?? loadTwinLocalMapMerged(options.examplesRoot, simulatorRoot);
  const localRef = flatTwinfileRef(ref.includes('/') ? ref : `twinfile/${ref}`);

  const catalogResolved = resolveViaCatalogHook({
    ref,
    name,
    tag,
    options,
    resolveCatalogTwinfile: options.resolveCatalogTwinfile,
  });
  if (catalogResolved?.ok) return catalogResolved;

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
      hint: `Searched under examples and ${options.placeRoot ?? 'no place'}/events`,
    },
  ]);
}

export function resolveRelativeTwinfilePath(from: string, baseRoot: string): string {
  return resolve(baseRoot, from);
}

export function loadTwinfileAtPath(path: string): Result<LoadedTwinfile> {
  return loadTwinfile(path);
}
