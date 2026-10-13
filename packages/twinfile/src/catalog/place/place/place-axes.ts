import {
  archetypeForAxes,
  isPlaceArchetype,
  PLACE_ARCHETYPE_AXES,
  type PlaceArchetype,
  type PlaceArchetypeAxes,
  type PlaceAxes,
} from '@local-hosting/geotypes';

import type { PlaceComposeEntry, ResolvedPlaceAxes } from '@local-hosting/twinfile';
import type { Result } from '@local-hosting/twinfile';
import { err, ok } from '@local-hosting/twinfile';

const AXIS_NAMES: readonly (keyof PlaceAxes)[] = ['extent', 'vertical', 'movement'];

/** Declared `axes:` on a place twinfile. */
export function twinfileAxes(twinfile: Record<string, unknown>): Partial<PlaceAxes> {
  const raw = twinfile.axes;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const name of AXIS_NAMES) {
    const value = (raw as Record<string, unknown>)[name];
    if (typeof value === 'string') out[name] = value;
  }
  return out as Partial<PlaceAxes>;
}

export function getPlaceArchetype(place: unknown): PlaceArchetype | undefined {
  const site = (place as { place?: { archetype?: unknown } } | undefined)?.place;
  return isPlaceArchetype(site?.archetype) ? site.archetype : undefined;
}

/** Axes for a merged place: resolved `axes:` when declared, else the archetype's table row. */
export function getPlaceAxes(
  place: unknown,
  resolved: ResolvedPlaceAxes | undefined,
): PlaceArchetypeAxes | undefined {
  if (resolved) return resolved.axes;
  const archetype = getPlaceArchetype(place);
  return archetype ? PLACE_ARCHETYPE_AXES[archetype] : undefined;
}

function isCompleteAxes(axes: Partial<PlaceArchetypeAxes>): axes is PlaceArchetypeAxes {
  return Boolean(axes.extent && axes.vertical && axes.movement);
}

/**
 * Overlay declared `axes:` (stack order) on the inherited archetype's axes and derive the archetype.
 * `ownArchetype` is `place.archetype` from the top unit's own layers; it must match the derived value.
 */
export function resolveComposedAxes(
  stack: PlaceComposeEntry[],
  inherited: PlaceArchetype | undefined,
  ownArchetype: PlaceArchetype | undefined,
  file: string,
): Result<ResolvedPlaceAxes | undefined> {
  const declared: Partial<PlaceAxes> = {};
  for (const { loaded } of stack) Object.assign(declared, twinfileAxes(loaded.twinfile));
  if (Object.keys(declared).length === 0) return ok(undefined);

  const axes: Partial<PlaceArchetypeAxes> = { ...(inherited ? PLACE_ARCHETYPE_AXES[inherited] : {}), ...declared };
  if (!isCompleteAxes(axes)) {
    return err([{ code: 'E_ARCHETYPE_AXES', message: 'axes needs extent, vertical, and movement (or a base archetype)', file }]);
  }

  let archetype: PlaceArchetype;
  try {
    archetype = archetypeForAxes({ ...axes, vertical: axes.vertical === 'any' ? 'flat' : axes.vertical });
  } catch (cause) {
    return err([{ code: 'E_ARCHETYPE_AXES', message: (cause as Error).message, file }]);
  }
  if (ownArchetype && ownArchetype !== archetype) {
    return err([
      {
        code: 'E_ARCHETYPE_AXES_MISMATCH',
        message: `place.archetype ${ownArchetype} does not match axes (${axes.extent}/${axes.vertical}/${axes.movement} → ${archetype})`,
        file,
      },
    ]);
  }
  return ok({ axes, archetype });
}
