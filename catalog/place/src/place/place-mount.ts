import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { resolveGeotypeRef, schemaOrgTypeForGeotypeRef } from '@doppler-group/geotypes';

import type { TwinfileRef } from '@doppler-group/twinfile-core';
import { parseGeotypeTwinfile } from '@doppler-group/twinfile-core';
import type {
  ResolvePlaceMountOptions,
  PlaceMountLayoutLevel,
  PlaceMountLayoutPathway,
  PlaceMountLayoutSpace,
  TwinfilePlaceMount,
} from '@doppler-group/twinfile-core';
import { resolvedExamplePlaceFromTwinfileDir } from '@doppler-group/twinfile-core';
import { resolveExamplePlace } from '@doppler-group/twinfile-core';
import { pullTwinfileFromRegistry } from '@doppler-group/twinfile-core';
import {
  parsePlacesCatalogUri,
  resolvePlacesCatalog,
  type ParsedPlacesCatalog,
} from './parse-places-catalog-uri.js';

function venueKeyFromResolved(resolved: {
  twinfile: Record<string, unknown>;
  ref: TwinfileRef;
}): string {
  const name = String(
    resolved.twinfile.id ?? resolved.ref.replace(/^twinfile\//, '').split(':')[0],
  );
  return `venue:${name}`;
}

function layoutSpacesFromLayers(
  layers: readonly Record<string, unknown>[],
): PlaceMountLayoutSpace[] {
  const spacesLayer = layers.find((l) => 'spaces' in l);
  const spacesRaw = (spacesLayer?.spaces as Record<string, unknown>[] | undefined) ?? [];
  return spacesRaw
    .map((row) => {
      const id = String(row.id ?? '').trim();
      if (!id) {
        return null;
      }
      const order =
        typeof row.visit_order === 'number'
          ? row.visit_order
          : typeof row.order === 'number'
            ? row.order
            : undefined;
      return {
        id,
        ...(typeof row.name === 'string' ? { label: row.name } : {}),
        ...(order != null ? { order } : {}),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);
}

function layoutLevelsFromLayers(
  layers: readonly Record<string, unknown>[],
): PlaceMountLayoutLevel[] {
  const levelsLayer = layers.find((l) => 'levels' in l);
  const raw = (levelsLayer?.levels as Record<string, unknown>[] | undefined) ?? [];
  return raw
    .map((row) => {
      const id = String(row.id ?? '').trim();
      if (!id) {
        return null;
      }
      return {
        id,
        ...(typeof row.name === 'string' ? { label: row.name } : {}),
        ...(typeof row.ordinal === 'number' ? { order: row.ordinal } : {}),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);
}

function layoutPathwaysFromLayers(
  layers: readonly Record<string, unknown>[],
): PlaceMountLayoutPathway[] {
  const routesLayer = layers.find((l) => 'routes' in l);
  const raw = (routesLayer?.routes as Record<string, unknown>[] | undefined) ?? [];
  return raw
    .map((row) => {
      const id = String(row.id ?? '').trim();
      if (!id) {
        return null;
      }
      return {
        id,
        ...(typeof row.name === 'string' ? { label: row.name } : {}),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);
}

function spacesFromLayers(
  layers: readonly Record<string, unknown>[],
): Array<{ id: string; name?: string }> {
  return (layoutSpacesFromLayers(layers) ?? []).map((row) => ({
    id: row.id,
    ...(row.label ? { name: row.label } : {}),
  }));
}

function geoFromLayers(layers: readonly Record<string, unknown>[]): TwinfilePlaceMount['geo'] {
  const placeLayer = layers.find((l) => 'place' in l)?.place as Record<string, unknown> | undefined;
  const ext = placeLayer?.ext as Record<string, unknown> | undefined;
  const lat = ext?.lat ?? placeLayer?.lat;
  const lon = ext?.lon ?? placeLayer?.lon;
  if (typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon };
  }
  return undefined;
}

function visitMomentsFromLayers(layers: readonly Record<string, unknown>[]): {
  visitMomentIds: string[];
  defaultVisitMomentId?: string;
} {
  const visitsLayer = layers.find((l) => 'visits' in l);
  const raw = (visitsLayer?.visits as Record<string, unknown>[] | undefined) ?? [];
  const sorted = [...raw]
    .map((row) => ({
      id: String(row.id),
      order: typeof row.order === 'number' ? row.order : Number(row.order),
    }))
    .filter((row) => row.id.length > 0)
    .sort((a, b) => a.order - b.order);
  const visitMomentIds = sorted.map((row) => row.id);
  return {
    visitMomentIds,
    ...(visitMomentIds[0] ? { defaultVisitMomentId: visitMomentIds[0] } : {}),
  };
}

/** Map a resolved place unit to a portable mount record ({@link TwinfilePlaceMount}). */
export function placeMountFromResolved(resolved: {
  ref: TwinfileRef;
  twinfile: Record<string, unknown>;
  layers: Record<string, unknown>[];
}): TwinfilePlaceMount {
  const placeLayer = resolved.layers.find((l) => 'place' in l)?.place as
    | Record<string, unknown>
    | undefined;
  const spaces = spacesFromLayers(resolved.layers);
  const layoutSpaces = layoutSpacesFromLayers(resolved.layers);
  const layoutLevels = layoutLevelsFromLayers(resolved.layers);
  const layoutPathways = layoutPathwaysFromLayers(resolved.layers);
  const venueKey = venueKeyFromResolved(resolved);
  const title = String(placeLayer?.name ?? resolved.twinfile.name ?? venueKey);
  const defaultSpaceId = spaces[0]?.id;
  const geo = geoFromLayers(resolved.layers);
  const visits = visitMomentsFromLayers(resolved.layers);
  const geotype = parseGeotypeTwinfile(resolved.twinfile);
  const geotypeResolved = geotype ? resolveGeotypeRef(geotype.primary) : null;
  const schemaOrgType = geotype ? schemaOrgTypeForGeotypeRef(geotype.primary) : null;
  return {
    placeRef: resolved.ref,
    venueKey,
    title,
    ...(geotype
      ? {
          geotypePrimary: geotypeResolved?.slug ?? geotype.primary,
          ...(schemaOrgType ? { schemaOrgType } : {}),
        }
      : {}),
    spaceIds: spaces.map((row) => row.id),
    ...(defaultSpaceId ? { defaultSpaceId } : {}),
    ...(geo ? { geo } : {}),
    ...(visits.visitMomentIds.length
      ? {
          visitMomentIds: visits.visitMomentIds,
          ...(visits.defaultVisitMomentId ? { defaultVisitMomentId: visits.defaultVisitMomentId } : {}),
        }
      : {}),
    ...(layoutLevels.length ? { layoutLevels } : {}),
    ...(layoutSpaces.length ? { layoutSpaces } : {}),
    ...(layoutPathways.length ? { layoutPathways } : {}),
  };
}

function fileCatalogRoot(catalog: ParsedPlacesCatalog): string {
  if (catalog.kind !== 'file') {
    throw new Error('resolvePlaceMount: sync resolution requires a file:// places catalog');
  }
  return catalog.rootDir;
}

function normalizeRef(ref: string): TwinfileRef {
  return (ref.trim().startsWith('twinfile/') ? ref.trim() : `twinfile/${ref.trim()}`) as TwinfileRef;
}

function findPulledUnitRoot(outDir: string): string {
  const direct = join(outDir, 'Twinfile.yaml');
  if (statSync(direct, { throwIfNoEntry: false })?.isFile()) {
    return outDir;
  }
  for (const name of readdirSync(outDir)) {
    const child = join(outDir, name);
    if (!statSync(child).isDirectory()) continue;
    if (statSync(join(child, 'Twinfile.yaml'), { throwIfNoEntry: false })?.isFile()) {
      return child;
    }
  }
  throw new Error(`resolvePlaceMountAsync: no Twinfile.yaml under ${outDir}`);
}

function pullCachePath(ref: TwinfileRef, options: ResolvePlaceMountOptions): string {
  const base = options.pullCacheDir ?? join(tmpdir(), 'twinfile-places-cache');
  const safe = ref.replace(/[^a-zA-Z0-9._-]+/g, '_');
  return join(base, safe);
}

/** Resolve a place ref against a file catalog (sync). Use {@link resolvePlaceMountAsync} for `oci://`. */
export function resolvePlaceMount(
  ref: TwinfileRef,
  options: ResolvePlaceMountOptions = {},
): TwinfilePlaceMount {
  const catalog = resolvePlacesCatalog(options);
  if (!catalog) {
    return placeMountFromResolved(resolveExamplePlace(normalizeRef(ref)));
  }
  if (catalog.kind === 'oci') {
    throw new Error(
      'resolvePlaceMount: oci:// catalog requires resolvePlaceMountAsync (or pre-pull units to a file:// cache)',
    );
  }
  const normalized = normalizeRef(ref);
  const resolved = resolveExamplePlace(normalized, { examplesRoot: fileCatalogRoot(catalog) });
  return placeMountFromResolved(resolved);
}

/** Resolve a place ref — pulls from OCI when the catalog URI is `oci://`. */
export async function resolvePlaceMountAsync(
  ref: TwinfileRef,
  options: ResolvePlaceMountOptions = {},
): Promise<TwinfilePlaceMount> {
  const catalog = resolvePlacesCatalog(options);
  const normalized = normalizeRef(ref);

  if (!catalog || catalog.kind === 'file') {
    return resolvePlaceMount(normalized, options);
  }

  const outDir = pullCachePath(normalized, options);
  if (!statSync(join(outDir, 'Twinfile.yaml'), { throwIfNoEntry: false })?.isFile()) {
    mkdirSync(outDir, { recursive: true });
    const pulled = await pullTwinfileFromRegistry({
      ref: normalized,
      outDir,
      registry: options.registry ?? catalog.registry,
    });
    if (!pulled.ok) {
      const msg = pulled.errors.map((e) => e.message).join('; ');
      throw new Error(`resolvePlaceMountAsync: pull failed for ${normalized}: ${msg}`);
    }
  }

  const unitRoot = findPulledUnitRoot(outDir);
  const resolved = resolvedExamplePlaceFromTwinfileDir(unitRoot, normalized);
  return placeMountFromResolved(resolved);
}

export function resolvePlaceMounts(
  refs: readonly string[],
  options: ResolvePlaceMountOptions = {},
): TwinfilePlaceMount[] {
  return refs.map((row) => resolvePlaceMount(row as TwinfileRef, options));
}

export async function resolvePlaceMountsAsync(
  refs: readonly string[],
  options: ResolvePlaceMountOptions = {},
): Promise<TwinfilePlaceMount[]> {
  const results: TwinfilePlaceMount[] = [];
  for (const row of refs) {
    results.push(await resolvePlaceMountAsync(row as TwinfileRef, options));
  }
  return results;
}

export { parsePlacesCatalogUri, resolvePlacesCatalog, type ParsedPlacesCatalog };
