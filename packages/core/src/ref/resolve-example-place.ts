import { statSync } from 'node:fs';
import { join } from 'node:path';

import type { TwinfileRef } from '../types/twinfile-ref.js';
import type {
  ResolveExamplePlaceOptions,
  ResolvedExamplePlace,
} from '../types/resolved-example-place.js';
import { readYamlDocument } from '../validate/validate-yaml.js';
import { twinfilePlaceLayerPaths } from '../load/twinfile-paths.js';
import { isPatchesTwinfile, parseManifestPatches } from '../load/twinfile-instructions.js';
import { RefResolver } from './ref-resolver.js';
import { flatExampleUnitDir, listFlatExampleUnitNames } from '../paths/examples-catalog.js';
import { resolvePlaceExamplesCatalogRoot } from '../paths/catalog-layout.js';

import {
  loadTwinLocalMap,
  loadTwinLocalMapMerged,
  resolveTwinLocalPath,
} from './twin-local-map.js';

function parseRefName(ref: string, resolver: RefResolver): { name: string; version?: string } {
  const resolved = resolver.resolve(ref);
  const name = resolved.name ?? ref.replace(/^twinfile\//, '').split(':')[0] ?? ref;
  const tag = resolved.tag;
  return { name, version: tag };
}

function readLayerFile(unitRoot: string, rel: string): Record<string, unknown> {
  const path = join(unitRoot, rel);
  const doc = readYamlDocument(path).value;
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error(`resolveExamplePlace: layer ${rel} is not an object`);
  }
  return doc as Record<string, unknown>;
}

function resolveTwinfileDirFromRef(ref: TwinfileRef, examplesRoot: string): string {
  const normalized = ref.trim().startsWith('twinfile/') ? ref.trim() : (`twinfile/${ref.trim()}` as TwinfileRef);
  const localMap = loadTwinLocalMapMerged(examplesRoot);
  const localPath = resolveTwinLocalPath(normalized, localMap);
  if (localPath && statSync(localPath, { throwIfNoEntry: false })?.isDirectory()) {
    return localPath;
  }
  const resolver = new RefResolver();
  const { name } = parseRefName(normalized, resolver);
  return flatExampleUnitDir(examplesRoot, name);
}

export function resolvedExamplePlaceFromTwinfileDir(
  unitRoot: string,
  ref: TwinfileRef,
): ResolvedExamplePlace {
  const twinfilePath = join(unitRoot, 'Twinfile.yaml');
  if (!statSync(twinfilePath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`resolvedExamplePlaceFromTwinfileDir: no Twinfile.yaml at ${unitRoot}`);
  }
  const twinfile = readYamlDocument(twinfilePath).value as Record<string, unknown>;
  const layers = isPatchesTwinfile(twinfile)
    ? parseManifestPatches(twinfile).instructions.flatMap((step) => (step.type === 'patch' ? [step.doc] : []))
    : twinfilePlaceLayerPaths(twinfile).map((entry) => readLayerFile(unitRoot, entry.path));
  const normalized = ref.trim().startsWith('twinfile/') ? ref.trim() : (`twinfile/${ref.trim()}` as TwinfileRef);
  return { ref: normalized as TwinfileRef, rootDir: unitRoot, twinfile, layers };
}

/** Resolve a Twinfile place ref to on-disk example content (local dev; production uses OCI pull). */
export function resolveExamplePlace(
  ref: TwinfileRef,
  options: ResolveExamplePlaceOptions = {},
): ResolvedExamplePlace {
  const examplesRoot = options.examplesRoot ?? resolvePlaceExamplesCatalogRoot();
  const unitRoot = resolveTwinfileDirFromRef(ref, examplesRoot);
  return resolvedExamplePlaceFromTwinfileDir(unitRoot, ref);
}

/** @internal Tests and diagnostics for flat catalog layout. */
export function listSiteSlugs(examplesRoot: string): string[] {
  return listFlatExampleUnitNames(examplesRoot).filter(
    (name) => !name.startsWith('base-') && !name.startsWith('mixin-') && !name.endsWith('-programme'),
  );
}

/** List published-style place refs under the flat place catalog. */
export function listExamplePlaceRefs(examplesRoot: string = resolvePlaceExamplesCatalogRoot()): TwinfileRef[] {
  const names = listSiteSlugs(examplesRoot);
  const out: TwinfileRef[] = [];
  for (const name of names) {
    const unitDir = flatExampleUnitDir(examplesRoot, name);
    const twinfile = join(unitDir, 'Twinfile.yaml');
    if (!statSync(twinfile, { throwIfNoEntry: false })?.isFile()) continue;
    const head = readYamlDocument(twinfile).value as Record<string, unknown>;
    const version = String(head.version ?? '0.0.0');
    const refName = String(head.id ?? name);
    out.push(`twinfile/${refName}:${version}` as TwinfileRef);
  }
  if (out.length > 0) return out;

  const map = loadTwinLocalMap(examplesRoot);
  for (const ref of map.keys()) {
    const unitDir = map.get(ref);
    if (!unitDir) continue;
    const twinfile = join(unitDir, 'Twinfile.yaml');
    if (!statSync(twinfile, { throwIfNoEntry: false })?.isFile()) continue;
    const head = readYamlDocument(twinfile).value as Record<string, unknown>;
    const kind = String(head.kind ?? 'place');
    if (kind !== 'place' && kind !== '') continue;
    if (String(head.id ?? '').startsWith('base-')) continue;
    out.push(ref as TwinfileRef);
  }
  return out;
}
