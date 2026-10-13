import type { ComposedBuildLayer } from './twinfile-builder.js';
import type { LoadedTwinfile } from '@local-hosting/twinfile';
import { listTwinfileInstructions } from '@local-hosting/twinfile';
import type { PlanRoles } from '@local-hosting/twinfile';
import { composePlace, listPlaceEventBindings, type PlaceInheritOptions } from '../place/place-inherit.js';
import type { Result } from '@local-hosting/twinfile';
import { err, ok } from '@local-hosting/twinfile';
import type { TwinfileResolveOptions } from '@local-hosting/twinfile';
import { catalogResolveOptions } from '@local-hosting/twinfile';

export function readManifestLayers(
  unit: LoadedTwinfile,
  refPrefix: string,
  kind: ComposedBuildLayer['kind'],
): ComposedBuildLayer[] {
  return listTwinfileInstructions(unit).flatMap((step) =>
    step.type === 'patch'
      ? [
          {
            ref: `${refPrefix}${step.ref}`,
            kind,
            patch: step.doc,
            ...(step.mergeMode !== 'patch' ? { mergeMode: step.mergeMode } : {}),
          },
        ]
      : [],
  );
}

export function rolesFromBindingDoc(doc: Record<string, unknown>): PlanRoles {
  const roles = doc.roles;
  if (!roles || typeof roles !== 'object' || Array.isArray(roles)) return {};
  const out: PlanRoles = {};
  for (const [name, ids] of Object.entries(roles as Record<string, unknown>)) {
    if (Array.isArray(ids)) {
      out[name] = ids.filter((x): x is string => typeof x === 'string');
    }
  }
  return out;
}

export function findEventBindingForTarget(
  place: LoadedTwinfile,
  targetName: string,
  options?: PlaceInheritOptions,
): Result<{ rel: string; doc: Record<string, unknown>; planRoles: PlanRoles } | undefined> {
  const bindings = listPlaceEventBindings(place, options);
  if (!bindings.ok) return bindings;
  const match = bindings.value.find((row) => String(row.doc.for ?? '') === targetName);
  return ok(
    match ? { rel: match.rel, doc: match.doc, planRoles: rolesFromBindingDoc(match.doc) } : undefined,
  );
}

export function eventBindingLayer(ref: string, planRoles: PlanRoles): ComposedBuildLayer {
  return { ref, kind: 'binding', patch: { roles: planRoles } };
}

export function loadEventBindingDocuments(
  place: LoadedTwinfile,
  options?: PlaceInheritOptions,
): Record<string, unknown> {
  const bindings = listPlaceEventBindings(place, options);
  return bindings.ok ? Object.fromEntries(bindings.value.map((row) => [row.rel, row.doc])) : {};
}

export function composePlaceLayers(
  place: LoadedTwinfile,
  options?: PlaceInheritOptions,
): Result<ComposedBuildLayer[]> {
  const composed = composePlace(place, options);
  return composed.ok ? ok(composed.value.layers) : composed;
}

export function composeSingleTwinfileLayers(
  unit: LoadedTwinfile,
  options?: TwinfileResolveOptions,
): Result<ComposedBuildLayer[]> {
  const kind = String(unit.twinfile.kind ?? '');
  if (kind === 'place') {
    const inherit: PlaceInheritOptions | undefined = options?.examplesRoot
      ? catalogResolveOptions(options.examplesRoot)
      : undefined;
    return composePlaceLayers(unit, inherit);
  }
  if (kind === 'event') {
    return ok(readManifestLayers(unit, '', 'place'));
  }
  if (kind === 'scenario') {
    return err([
      {
        code: 'E_BUILD',
        message: 'Use composeScenarioLayers for scenario units',
        file: unit.twinfilePath,
      },
    ]);
  }
  return err([{ code: 'E_BUILD', message: `Unsupported unit kind ${kind}`, file: unit.twinfilePath }]);
}
