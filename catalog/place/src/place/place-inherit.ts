import type { LoadedTwinfile } from '@doppler-group/twinfile-core';
import { listTwinfileInstructions, listTwinfileSituationBindings } from '@doppler-group/twinfile-core';
import { mergeObjects } from '@doppler-group/twinfile-core';
import type { PlaceData } from '@doppler-group/twinfile-core';
import { resolveTwinfileByRef, type TwinfileResolveOptions } from '@doppler-group/twinfile-core';
import { catalogResolveOptions } from '@doppler-group/twinfile-core';
import type { ComposedPlace, PlaceComposeEntry, PlaceComposeLayer } from '@doppler-group/twinfile-core';
import type { SituationBindingDoc } from '@doppler-group/twinfile-core';
import type { Result } from '@doppler-group/twinfile-core';
import { err, ok } from '@doppler-group/twinfile-core';
import { getPlaceArchetype, getPlaceAxes, resolveComposedAxes } from './place-axes.js';
import { applyCopyInstruction, listCopiedTwinfiles } from './place-copy.js';
import { checkMixinAppliesTo, getMixinUnits } from './place-mixins.js';

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

/** Compose order (RFC 0004): for each unit in the `from:` chain (root first), its `with:` mixins, then the unit. */
export function getPlaceComposeStack(
  place: LoadedTwinfile,
  options: PlaceInheritOptions | undefined,
): Result<PlaceComposeEntry[]> {
  const chain = getFromChain(place, options);
  if (!chain.ok) return chain;
  const stack: PlaceComposeEntry[] = [];
  for (const unit of chain.value) {
    const mixins = getMixinUnits(unit, options);
    if (!mixins.ok) return mixins;
    stack.push(...mixins.value.map((mixin) => ({ loaded: mixin, role: 'mixin' as const })));
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
    case 'mixin':
      return `with/${name}/`;
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

/**
 * Build layers and merged place, Dockerfile-style: walk the `from:` chain root first; at each unit apply its
 * `with:` mixins, then its instructions in order (each patch or copy is one or more layers).
 */
export function composePlace(place: LoadedTwinfile, options: PlaceInheritOptions | undefined): Result<ComposedPlace> {
  const stack = getPlaceComposeStack(place, options);
  if (!stack.ok) return stack;

  const composeLayers: PlaceComposeLayer[] = [];
  /** The stack plus mixins copied by `copy:`, each placed before its owner (like `with:`). */
  const axesStack: PlaceComposeEntry[] = [];
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
        if (copied.value.mixin) axesStack.push({ loaded: copied.value.mixin, role: 'mixin' });
        continue;
      }
      const layer: PlaceComposeLayer = {
        ref: `${prefix}${step.ref}`,
        kind: entry.role === 'mixin' ? 'mixin' : 'place',
        patch: step.doc,
        ...(step.mergeMode !== 'patch' ? { mergeMode: step.mergeMode } : {}),
      };
      composeLayers.push(layer);
      merged = mergeObjects(merged, layer.patch, layer.mergeMode ? { mode: layer.mergeMode } : {}) as PlaceData;
      if (entry.role === 'self') ownArchetype = getPlaceArchetype(step.doc) ?? ownArchetype;
    }
    axesStack.push(entry);
  }

  const axes = resolveComposedAxes(axesStack, getPlaceArchetype(merged), ownArchetype, place.twinfilePath);
  if (!axes.ok) return axes;
  if (axes.value) {
    const patch = { place: { archetype: axes.value.archetype } };
    composeLayers.push({ ref: 'axes', kind: 'patch', patch });
    merged = mergeObjects(merged, patch) as PlaceData;
  }

  const mixins = axesStack.filter((entry) => entry.role === 'mixin').map((entry) => entry.loaded);
  const appliesErrors = checkMixinAppliesTo(mixins, getPlaceAxes(merged, axes.value), place.twinfilePath);
  if (appliesErrors.length > 0) return err(appliesErrors);

  return ok({ stack: stack.value, layers: composeLayers, place: merged, ...(axes.value ? { axes: axes.value } : {}) });
}

/** Merge base `from` chain, `with:` mixins, then this place's layer files (same rules as build). */
export function mergePlaceFromTwinfile(place: LoadedTwinfile, options: PlaceInheritOptions | undefined): Result<PlaceData> {
  const composed = composePlace(place, options);
  return composed.ok ? ok(composed.value.place) : composed;
}

/**
 * Effective situation bindings for a place: the nearest unit in the `from:` chain (child replaces base),
 * then every mixin's bindings, then bindings of copied units. First occurrence of a `rel` wins.
 */
export function listPlaceSituationBindings(
  place: LoadedTwinfile,
  options: PlaceInheritOptions | undefined,
): Result<SituationBindingDoc[]> {
  const stack = getPlaceComposeStack(place, options);
  if (!stack.ok) return stack;
  const lookupRoots = stack.value.map((entry) => entry.loaded.root).reverse();
  let placeBindings: SituationBindingDoc[] = [];
  const mixinBindings: SituationBindingDoc[] = [];
  const copiedBindings: SituationBindingDoc[] = [];
  for (const { loaded: unit, role } of stack.value) {
    const bindings = listTwinfileSituationBindings(unit, lookupRoots);
    if (role === 'mixin') mixinBindings.push(...bindings);
    else if (bindings.length > 0) placeBindings = bindings;
    const copied = listCopiedTwinfiles(unit, options);
    if (!copied.ok) return copied;
    for (const source of copied.value) copiedBindings.push(...listTwinfileSituationBindings(source));
  }
  const seen = new Set<string>();
  return ok(
    [...placeBindings, ...mixinBindings, ...copiedBindings].filter((row) => {
      if (seen.has(row.rel)) return false;
      seen.add(row.rel);
      return true;
    }),
  );
}
