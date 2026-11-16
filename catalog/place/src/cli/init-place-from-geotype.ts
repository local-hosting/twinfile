import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isAssetGeotype,
  PLACE_ARCHETYPE_AXES,
  placeAxesForSlug,
  placeScaffoldForSlug,
  suggestBuildingImportForSlug,
  resolveGeotypeRef,
  type PlaceArchetype,
  type PlaceAxes,
  type PlaceLayerKind,
} from '@local-hosting/geotypes';
import { stringify } from 'yaml';

import { PLACE_DEMO_EXT_H3 } from '../place/demo-ext-h3.js';
import { resolveExamplesRoot } from '@local-hosting/twinfile-core';
import { twinHeadPath } from '@local-hosting/twinfile-core';
import { resolveSimulatorRoot } from '@local-hosting/twinfile-core';
import { placeBaseRefForArchetype } from '@local-hosting/twinfile-core';
import { decoratePlaceFromGeotype } from './decorate-place-from-geotype.js';
import { writeCampusBuildingScaffold } from '@local-hosting/twinfile-core/cli';
import { formatPlaceManifestFile, orderPlaceTwinfileKeys } from '@local-hosting/twinfile-core/cli';

export type InitPlaceFromGeotypeOptions = {
  geotype: string;
  geotypeRegistry: string;
  unitName: string;
  useFrom: boolean;
};

function displayNameFromSlug(slug: string): string {
  return slug
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Geotype axes the archetype leaves open (e.g. campus `vertical: any` → `stacked`). */
function getAxesBeyondArchetype(slug: string, archetype: PlaceArchetype): Partial<PlaceAxes> {
  const resolved = placeAxesForSlug(slug);
  if (!resolved) return {};
  const base = PLACE_ARCHETYPE_AXES[archetype];
  const axes: Partial<PlaceAxes> = {};
  if (base.extent !== resolved.extent) axes.extent = resolved.extent;
  if (base.vertical !== resolved.vertical) axes.vertical = resolved.vertical;
  if (base.movement !== resolved.movement) axes.movement = resolved.movement;
  return axes;
}

export function initPlaceFromGeotype(
  targetDir: string,
  options: InitPlaceFromGeotypeOptions,
): void {
  if (existsSync(twinHeadPath(targetDir))) {
    throw new Error(`Twinfile already exists: ${twinHeadPath(targetDir)}`);
  }

  const slug = options.geotype.trim().toLowerCase();
  if (!resolveGeotypeRef(slug)) {
    throw new Error(`Unknown geotype "${options.geotype}" (expected @local-hosting/geotypes slug)`);
  }
  if (isAssetGeotype(slug)) {
    throw new Error(
      `Geotype "${slug}" is an asset, not a place — add it as a kind in a place's assets.yaml layer`,
    );
  }

  const scaffold = placeScaffoldForSlug(slug);
  if (!scaffold) {
    throw new Error(`No place scaffold for geotype "${slug}"`);
  }

  const geotype = {
    primary: slug,
    registry: options.geotypeRegistry,
  };
  const axes = getAxesBeyondArchetype(slug, scaffold.archetype);
  const twinfile = orderPlaceTwinfileKeys({
    ...(options.useFrom ? { from: placeBaseRefForArchetype(scaffold.archetype) } : {}),
    ...(Object.keys(axes).length > 0 ? { axes } : {}),
    twinfile: 2,
    kind: 'place',
    id: options.unitName,
    name: displayNameFromSlug(options.unitName),
    version: '0.1.0',
    stability: 'example',
    geotype,
    steps: [],
  });

  const place: Record<string, unknown> = {
    name: displayNameFromSlug(slug),
    kind: slug,
    timezone: 'UTC',
    published: false,
  };
  // `from:` supplies archetype + authoring_scale (like a base image). Patch them here only when not inheriting.
  if (!options.useFrom) {
    place.archetype = scaffold.archetype;
    place.authoring_scale = { ...scaffold.authoring_scale };
  }

  const { extent } = PLACE_ARCHETYPE_AXES[scaffold.archetype];
  if (extent === 'site' || extent === 'area' || extent === 'footprint') {
    place.ext = {
      lat: 0,
      lon: 0,
      h3: PLACE_DEMO_EXT_H3[scaffold.archetype],
    };
  }

  twinfile.steps = [{ place }];
  mkdirSync(targetDir, { recursive: true });
  const twinfilePath = twinHeadPath(targetDir);
  writeFileSync(twinfilePath, stringify(twinfile));
  formatPlaceManifestFile(twinfilePath);
  writeCampusBuildingScaffold(targetDir, options.unitName, suggestBuildingImportForSlug(slug));
}

export type CreatePlaceOptions = {
  geotype: string;
  unitName?: string;
  useFrom?: boolean;
  decorate?: boolean;
};

export type CreatePlaceResult = {
  dir: string;
  unitName: string;
  geotype: string;
  mixins: string[];
  bindings: string[];
  suggestedLayers: PlaceLayerKind[];
  suggestBuildingImport?: boolean;
  decorateNote?: string;
};

/** Registry pin recorded on a new place twinfile. */
export function pinnedGeotypeRegistry(): string {
  const corePkgPath = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');
  const corePkg = JSON.parse(readFileSync(corePkgPath, 'utf8')) as {
    twinfilePinnedDependencies?: Record<string, string>;
  };
  const version = corePkg.twinfilePinnedDependencies?.['@local-hosting/geotypes'] ?? '0.1.2';
  return `@local-hosting/geotypes@${version}`;
}

function unitNameForDir(target: string, unitName?: string): string {
  const named = unitName?.trim();
  if (named) return named;
  const dirName = target.split(/[/\\]/).filter(Boolean).pop()?.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return dirName || 'example-place';
}

/** Same scaffold `twin init place --geotype` writes, including optional golden mixins. */
export function createPlace(targetDir: string, options: CreatePlaceOptions): CreatePlaceResult {
  const target = resolve(targetDir);
  const geotype = options.geotype.trim().toLowerCase();
  const unitName = unitNameForDir(target, options.unitName);
  const useFrom = options.useFrom !== false;
  const decorate = options.decorate !== false;

  initPlaceFromGeotype(target, {
    geotype,
    geotypeRegistry: pinnedGeotypeRegistry(),
    unitName,
    useFrom,
  });

  const suggestBuildings = suggestBuildingImportForSlug(geotype);
  const created: CreatePlaceResult = {
    dir: target,
    unitName,
    geotype,
    mixins: [],
    bindings: [],
    suggestedLayers: [],
    ...(suggestBuildings ? { suggestBuildingImport: true } : {}),
  };

  if (!decorate) return created;

  const examplesRoot = resolveExamplesRoot(target);
  if (!examplesRoot) {
    created.decorateNote = 'set TF_TWINFILE_ROOT to wire situations from @local-hosting/twinfile-simulator';
    return created;
  }

  const simulatorRoot = resolveSimulatorRoot(target);
  const decorated = decoratePlaceFromGeotype(target, geotype, {
    examplesRoot,
    simulatorRoot: simulatorRoot ?? undefined,
  });
  created.mixins = decorated.mixins;
  created.bindings = decorated.bindings;
  created.suggestedLayers = decorated.suggestedLayers;
  return created;
}
