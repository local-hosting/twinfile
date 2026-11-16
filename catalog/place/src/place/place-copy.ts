import { basename, resolve } from 'node:path';

import { loadTwinfile, type LoadedTwinfile } from '@local-hosting/twinfile-core';
import { listTwinfileInstructions } from '@local-hosting/twinfile-core';
import { mergeObjects } from '@local-hosting/twinfile-core';
import type { PlaceData } from '@local-hosting/twinfile-core';
import { resolveTwinfileByRef } from '@local-hosting/twinfile-core';
import { catalogResolveOptions } from '@local-hosting/twinfile-core';
import { composePlace, type PlaceInheritOptions } from './place-inherit.js';
import { prefixImportedPlaceData } from './place-import-prefix.js';
import type { PlaceComposeLayer } from '@local-hosting/twinfile-core';
import type { TwinfileCopyInstruction } from '@local-hosting/twinfile-core';
import type { Result } from '@local-hosting/twinfile-core';
import { err, ok } from '@local-hosting/twinfile-core';
import { copyRefAlternates, isRecord } from '@local-hosting/twinfile-core';

export type CopyResult = {
  place: PlaceData;
  layers: PlaceComposeLayer[];
};

export function isLocalCopyRef(ref: string): boolean {
  return ref.startsWith('./') || ref.startsWith('../');
}

/** One-release alias: unit-layout `parts/` ↔ legacy `buildings/` (RFC 0009). */


/** `copy:` source: `./path` is a nested unit relative to the owner; anything else is a published ref. */
export function resolveCopySource(
  owner: LoadedTwinfile,
  ref: string,
  options: PlaceInheritOptions | undefined,
): Result<LoadedTwinfile> {
  if (isLocalCopyRef(ref)) {
    const direct = loadTwinfile(resolve(owner.root, ref));
    if (direct.ok) return direct;
    for (const alt of copyRefAlternates(ref)) {
      const loaded = loadTwinfile(resolve(owner.root, alt));
      if (loaded.ok) return loaded;
    }
    return direct;
  }
  if (!options?.examplesRoot) {
    return err([
      { code: 'E_BUILD', message: `copy: ${ref} requires examplesRoot to resolve`, file: owner.twinfilePath },
    ]);
  }
  const resolved = resolveTwinfileByRef(ref, catalogResolveOptions(options.examplesRoot));
  return resolved.ok ? ok(resolved.value.loaded) : resolved;
}

function copyLabel(step: TwinfileCopyInstruction, source: LoadedTwinfile): string {
  if (step.into) return step.into;
  return isLocalCopyRef(step.copy) ? basename(step.copy) : String(source.twinfile.id ?? step.ref);
}

/** Copied place rows never carry the source's `place` metadata or level rows (levels belong to the site). */
function prefixLayerPatch(patch: unknown, prefix: string, into: string | undefined): unknown {
  if (!isRecord(patch)) return patch;
  const { place: _place, ...rest } = patch;
  if (Object.keys(rest).length === 0) return undefined;
  const prefixed = prefixImportedPlaceData(rest as PlaceData, prefix, into, {
    stripPlace: true,
    stripLevels: 'levels' in rest,
  });
  return Object.keys(prefixed).length > 0 ? prefixed : undefined;
}

function copyPlace(
  owner: LoadedTwinfile,
  step: TwinfileCopyInstruction,
  source: LoadedTwinfile,
  merged: PlaceData,
  options: PlaceInheritOptions | undefined,
): Result<CopyResult> {
  if (step.into && !(merged.spaces ?? []).some((space) => space.id === step.into)) {
    return err([
      {
        code: 'E_BUILD',
        message: `copy ${step.copy}: no space "${step.into}" to copy into (declare it in an earlier patch)`,
        file: owner.twinfilePath,
      },
    ]);
  }
  const composed = composePlace(source, options);
  if (!composed.ok) return composed;
  const prefix = step.prefix ?? (step.into ? `${step.into}-` : '');
  const label = copyLabel(step, source);
  const layers: PlaceComposeLayer[] = [];
  for (const layer of composed.value.layers) {
    const patch = prefixLayerPatch(layer.patch, prefix, step.into);
    if (patch === undefined) continue;
    layers.push({ ...layer, ref: `copy/${label}/${layer.ref}`, kind: 'copy', patch });
  }
  const rows = prefixImportedPlaceData(composed.value.place, prefix, step.into, {
    stripPlace: true,
    stripLevels: true,
  });
  return ok({ place: mergeObjects(merged, rows) as PlaceData, layers });
}

/** Run one `copy:` instruction on top of the place built so far. */
export function applyCopyInstruction(
  owner: LoadedTwinfile,
  step: TwinfileCopyInstruction,
  merged: PlaceData,
  options: PlaceInheritOptions | undefined,
): Result<CopyResult> {
  const source = resolveCopySource(owner, step.copy, options);
  if (!source.ok) return source;
  const kind = String(source.value.twinfile.kind ?? '');
  if (kind !== 'place') {
    return err([
      { code: 'E_BUILD', message: `copy ${step.copy}: expected a place unit, got ${kind}`, file: owner.twinfilePath },
    ]);
  }
  return copyPlace(owner, step, source.value, merged, options);
}

/** Every unit a place copies in, depth-first (copied units' own copies included). */
export function listCopiedTwinfiles(
  owner: LoadedTwinfile,
  options: PlaceInheritOptions | undefined,
): Result<LoadedTwinfile[]> {
  const out: LoadedTwinfile[] = [];
  for (const step of listTwinfileInstructions(owner)) {
    if (step.type !== 'copy') continue;
    const source = resolveCopySource(owner, step.copy, options);
    if (!source.ok) return source;
    out.push(source.value);
    const nested = listCopiedTwinfiles(source.value, options);
    if (!nested.ok) return nested;
    out.push(...nested.value);
  }
  return ok(out);
}
