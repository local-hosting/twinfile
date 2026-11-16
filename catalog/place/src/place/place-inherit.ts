import type { LoadedTwinfile } from '@local-hosting/twinfile-core';
import { listTwinfileInstructions, listTwinfileEventBindings } from '@local-hosting/twinfile-core';
import { mergeObjects } from '@local-hosting/twinfile-core';
import type { PlaceData } from '@local-hosting/twinfile-core';
import { resolveTwinfileByRef, type TwinfileResolveOptions } from '@local-hosting/twinfile-core';
import { catalogResolveOptions } from '@local-hosting/twinfile-core';
import type { ComposedPlace, PlaceComposeEntry, PlaceComposeLayer } from '@local-hosting/twinfile-core';
import type { EventBindingDoc } from '@local-hosting/twinfile-core';
import type { Result } from '@local-hosting/twinfile-core';
import { err, ok } from '@local-hosting/twinfile-core';
import { getPlaceArchetype, resolveComposedAxes } from './place-axes.js';
import { applyCopyInstruction, listCopiedTwinfiles } from './place-copy.js';

export type PlaceInheritOptions = Pick<TwinfileResolveOptions, 'examplesRoot'>;

function resolvePlaceBaseUnit(
  place: LoadedTwinfile,
  options: PlaceInheritOptions | undefined,
): Result<LoadedTwinfile | undefined> {
  const from = place.twinfile.from;
  if (typeof from !== 'string' || !from.trim()) return ok(undefined);
  if (!options?.examplesRoot) {
    return err([
      {
        code: 'E_BUILD',
        message: 'Place from requires examplesRoot (or run from a linked examples tree)',
        file: place.twinfilePath,
      },
    ]);
  }
  const base = resolveTwinfileByRef(from.trim(), catalogResolveOptions(options.examplesRoot));
  if (!base.ok) return base;
  if (base.value.loaded.twinfile.kind !== 'place') {
    return err([
      {
        code: 'E_BUILD',
        message: `Place from must reference a place unit: ${from}`,
        file: place.twinfilePath,
      },
    ]);
  }
  return ok(base.value.loaded);
}

function getFromChain(place: LoadedTwinfile, options: PlaceInheritOptions | undefined): Result<LoadedTwinfile[]> {
  const chain: LoadedTwinfile[] = [];
  const seen = new Set<string>();
  let cur: LoadedTwinfile | undefined = place;
  while (cur) {
    if (seen.has(cur.root)) {
      return err([{ code: 'E_BUILD', message: 'Place from chain contains a cycle', file: cur.twinfilePath }]);
    }
    seen.add(cur.root);
    chain.unshift(cur);
    const base = resolvePlaceBaseUnit(cur, options);
    if (!base.ok) return base;
    cur = base.value;
  }
  return ok(chain);
}

/** Compose order (RFC 0004): each unit in the `from:` chain, root first. */
export function getPlaceComposeStack(
  place: LoadedTwinfile,
  options: PlaceInheritOptions | undefined,
): Result<PlaceComposeEntry[]> {
  const chain = getFromChain(place, options);
  if (!chain.ok) return chain;
  const stack: PlaceComposeEntry[] = [];
  for (const unit of chain.value) {
    if (unit.twinfile.with !== undefined) {
      return err([
        { code: 'E_BUILD', message: 'with: is not supported; put the rows in the place or its base', file: unit.twinfilePath },
      ]);
    }
    stack.push({ loaded: unit, role: unit.root === place.root ? 'self' : 'from' });
  }
  return ok(stack);
}

function getLayerPrefix({ loaded, role }: PlaceComposeEntry): string {
  const name = String(loaded.twinfile.id ?? 'place');
  switch (role) {
    case 'self':
      return '';
    case 'from':
      return `from/${name}/`;
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

/**
 * Build layers and merged place, Dockerfile-style: walk the `from:` chain root first and apply each unit's
 * instructions in order (each patch or copy is one or more layers).
 */
export function composePlace(place: LoadedTwinfile, options: PlaceInheritOptions | undefined): Result<ComposedPlace> {
  const stack = getPlaceComposeStack(place, options);
  if (!stack.ok) return stack;

  const composeLayers: PlaceComposeLayer[] = [];
  let merged: PlaceData = {};
  let ownArchetype: ReturnType<typeof getPlaceArchetype>;
  for (const entry of stack.value) {
    const prefix = getLayerPrefix(entry);
    for (const step of listTwinfileInstructions(entry.loaded)) {
      if (step.type === 'copy') {
        const copied = applyCopyInstruction(entry.loaded, step, merged, options);
        if (!copied.ok) return copied;
        composeLayers.push(...copied.value.layers.map((layer) => ({ ...layer, ref: `${prefix}${layer.ref}` })));
        merged = copied.value.place;
        continue;
      }
      const layer: PlaceComposeLayer = {
        ref: `${prefix}${step.ref}`,
        kind: 'place',
        patch: step.doc,
        ...(step.mergeMode !== 'patch' ? { mergeMode: step.mergeMode } : {}),
      };
      composeLayers.push(layer);
      merged = mergeObjects(merged, layer.patch, layer.mergeMode ? { mode: layer.mergeMode } : {}) as PlaceData;
      if (entry.role === 'self') ownArchetype = getPlaceArchetype(step.doc) ?? ownArchetype;
    }
  }

  const axes = resolveComposedAxes(stack.value, getPlaceArchetype(merged), ownArchetype, place.twinfilePath);
  if (!axes.ok) return axes;
  if (axes.value) {
    const patch = { place: { archetype: axes.value.archetype } };
    composeLayers.push({ ref: 'axes', kind: 'patch', patch });
    merged = mergeObjects(merged, patch) as PlaceData;
  }

  return ok({ stack: stack.value, layers: composeLayers, place: merged, ...(axes.value ? { axes: axes.value } : {}) });
}

/** Merge base `from` chain, then this place's layer files (same rules as build). */
export function mergePlaceFromTwinfile(place: LoadedTwinfile, options: PlaceInheritOptions | undefined): Result<PlaceData> {
  const composed = composePlace(place, options);
  return composed.ok ? ok(composed.value.place) : composed;
}

/**
 * Effective event bindings for a place: the nearest unit in the `from:` chain (child replaces base),
 * then bindings of copied units. First occurrence of a `rel` wins.
 */
export function listPlaceEventBindings(
  place: LoadedTwinfile,
  options: PlaceInheritOptions | undefined,
): Result<EventBindingDoc[]> {
  const stack = getPlaceComposeStack(place, options);
  if (!stack.ok) return stack;
  const lookupRoots = stack.value.map((entry) => entry.loaded.root).reverse();
  let placeBindings: EventBindingDoc[] = [];
  const copiedBindings: EventBindingDoc[] = [];
  for (const { loaded: unit } of stack.value) {
    const bindings = listTwinfileEventBindings(unit, lookupRoots);
    if (bindings.length > 0) placeBindings = bindings;
    const copied = listCopiedTwinfiles(unit, options);
    if (!copied.ok) return copied;
    for (const source of copied.value) copiedBindings.push(...listTwinfileEventBindings(source));
  }
  const seen = new Set<string>();
  return ok(
    [...placeBindings, ...copiedBindings].filter((row) => {
      if (seen.has(row.rel)) return false;
      seen.add(row.rel);
      return true;
    }),
  );
}
