import type { PlaceArchetype, PlaceArchetypeAxes } from '@doppler-group/geotypes';

import type { LoadedTwinfile } from '@doppler-group/twinfile-core';
import { resolveExamplesRoot } from '@doppler-group/twinfile-core';
import { getPlaceArchetype, getPlaceAxes } from '../place/place-axes.js';
import { composePlace } from '../place/place-inherit.js';
import type { Result, TwinError } from '@doppler-group/twinfile-core';
import { err, ok } from '@doppler-group/twinfile-core';
import { checkPlaceLayoutIndex } from '@doppler-group/twinfile-core';

export type { PlaceArchetype } from '@doppler-group/geotypes';

export type PlaceVisitBeat = {
  id: string;
  kind: string;
  space: string;
  order: number;
  name?: string;
};

export type PlaceLayoutView = {
  place?: Record<string, unknown>;
  spaces: Array<Record<string, unknown>>;
  levels: Array<Record<string, unknown>>;
  visits: PlaceVisitBeat[];
};

export function layoutViewFromMerged(place: Record<string, unknown>): PlaceLayoutView {
  const site = place.place as Record<string, unknown> | undefined;
  const spaces = (place.spaces as Array<Record<string, unknown>> | undefined) ?? [];
  const levels = (place.levels as Array<Record<string, unknown>> | undefined) ?? [];
  const visitsRaw = (place.visits as Array<Record<string, unknown>> | undefined) ?? [];
  const visits: PlaceVisitBeat[] = [];
  for (const row of visitsRaw) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    visits.push({
      id: String(row.id),
      kind: String(row.kind),
      space: String(row.space),
      order: Number(row.order),
      ...(typeof row.name === 'string' ? { name: row.name } : {}),
    });
  }
  return {
    ...(site ? { place: site } : {}),
    spaces,
    levels,
    visits,
  };
}

function hasSiteAnchor(place: Record<string, unknown> | undefined): boolean {
  const footprint = place?.footprint;
  if (footprint !== null && typeof footprint === 'object') return true;
  const ext = place?.ext;
  const extRecord = ext !== null && typeof ext === 'object' ? (ext as Record<string, unknown>) : undefined;
  return (
    typeof extRecord?.lat === 'number' &&
    typeof extRecord?.lon === 'number' &&
    Number.isFinite(extRecord.lat) &&
    Number.isFinite(extRecord.lon)
  );
}

function hasVisitOrder(space: Record<string, unknown>): boolean {
  const visitOrder = space.visit_order;
  return typeof visitOrder === 'number' && Number.isInteger(visitOrder) && visitOrder >= 0;
}

/** Load-time rules per axis (spec/doc/place/place-archetypes.md#validation-per-axis). */
function checkArchetypeAxes(
  layout: PlaceLayoutView,
  archetype: PlaceArchetype,
  axes: PlaceArchetypeAxes,
  file: string,
): TwinError[] {
  const { extent, vertical, movement } = axes;
  const errors: TwinError[] = [];
  for (const space of layout.spaces) {
    const id = String(space.id);
    if (vertical === 'stacked' && (typeof space.level !== 'string' || !space.level.trim())) {
      errors.push({ code: 'E_LAYOUT', message: `Space "${id}" requires level (archetype ${archetype})`, file });
    }
    if (movement === 'sequenced' && !hasVisitOrder(space)) {
      errors.push({ code: 'E_LAYOUT', message: `Space "${id}" requires visit_order (archetype ${archetype})`, file });
    }
  }
  if (vertical === 'flat' && layout.levels.length > 1) {
    errors.push({ code: 'E_LAYOUT', message: `archetype ${archetype} allows at most one level`, file });
  }
  if (extent !== 'footprint' && extent !== 'route' && !hasSiteAnchor(layout.place)) {
    errors.push({
      code: 'E_LAYOUT',
      message: `archetype ${archetype} requires place.footprint or place.ext lat/lon`,
      file,
    });
  }
  return errors;
}

export function checkPlaceArchetype(unit: LoadedTwinfile): Result<{ archetype?: PlaceArchetype }> {
  if (unit.twinfile.kind !== 'place') {
    return ok({});
  }

  const examplesRoot = resolveExamplesRoot(unit.root) ?? resolveExamplesRoot(process.cwd());
  const composed = composePlace(unit, examplesRoot ? { examplesRoot } : undefined);
  if (!composed.ok) return composed;

  const layout = layoutViewFromMerged(composed.value.place as Record<string, unknown>);
  const errors: TwinError[] = [];
  const spaceIds = new Set(layout.spaces.map((row) => String(row.id)));

  for (const visit of layout.visits) {
    if (!spaceIds.has(visit.space)) {
      errors.push({
        code: 'E_LAYOUT',
        message: `Visit "${visit.id}" references unknown space "${visit.space}"`,
        file: unit.root,
      });
    }
  }

  const archetype = getPlaceArchetype(composed.value.place);
  const axes = getPlaceAxes(composed.value.place, composed.value.axes);
  if (archetype && axes) {
    errors.push(...checkArchetypeAxes(layout, archetype, axes, unit.root));
  }

  for (const space of layout.spaces) {
    const id = String(space.id);
    const parent = space.parent;
    if (typeof parent !== 'string' || !parent.trim()) continue;
    if (parent === id) {
      errors.push({
        code: 'E_LAYOUT',
        message: `Space "${id}" parent must not equal its own id`,
        file: unit.root,
      });
      continue;
    }
    if (!spaceIds.has(parent)) {
      errors.push({
        code: 'E_LAYOUT',
        message: `Space "${id}" parent references unknown space "${parent}"`,
        file: unit.root,
      });
    }
  }

  const parentMap = new Map<string, string>();
  for (const space of layout.spaces) {
    const id = String(space.id);
    const parent = space.parent;
    if (typeof parent === 'string' && parent.trim()) {
      parentMap.set(id, parent.trim());
    }
  }
  for (const id of parentMap.keys()) {
    const seen = new Set<string>([id]);
    let cur: string | undefined = parentMap.get(id);
    while (cur) {
      if (seen.has(cur)) {
        errors.push({
          code: 'E_LAYOUT',
          message: `Space parent chain contains a cycle (includes "${id}")`,
          file: unit.root,
        });
        break;
      }
      seen.add(cur);
      cur = parentMap.get(cur);
    }
  }

  const indexCheck = checkPlaceLayoutIndex(unit, spaceIds);
  if (!indexCheck.ok) {
    errors.push(...indexCheck.errors);
  }

  if (errors.length > 0) return err(errors);
  return ok({ archetype });
}
