import { join } from 'node:path';

import { checkGeotypeTwinfile } from '@doppler-group/twinfile-core';
import { twinHeadPath, twinLockFileName, twinLockPath } from '@doppler-group/twinfile-core';
import type { PlaceWireJson } from '@doppler-group/twinfile-core';
import { placeImageDigest } from '@doppler-group/twinfile-core';
import { Place } from '../place/built-place.js';
import { composeScenarioLayers } from './compose-scenario.js';
import { composeSingleTwinfileLayers, loadEventBindingDocuments } from './compose-helpers.js';
import { digestFileBytes } from '@doppler-group/twinfile-core';
import { LayerCache } from '@doppler-group/twinfile-core';
import { TwinfileBuilder } from './twinfile-builder.js';
import { loadUnitRoot, type LoadedTwinfile } from '@doppler-group/twinfile-core';
import { isRunUnit } from '@doppler-group/twinfile-core';
import { ProcessorGraph } from '@doppler-group/twinfile-core';
import {
  lockRefKeyFromTwinfile,
  mergeLockEntry,
  readTwinfileLock,
  verifyLockEntry,
  writeTwinfileLock,
} from '@doppler-group/twinfile-core';
import { CORE_SPEC_PIN } from '@doppler-group/twinfile-core';
import type { Result } from '@doppler-group/twinfile-core';
import { err, ok } from '@doppler-group/twinfile-core';
import { ajvErrorsToTwinErrors } from '@doppler-group/twinfile-core';
import { getDefaultValidator } from '@doppler-group/twinfile-core';
import { embedEventBindings } from '../place/event-bindings.js';
import { PlaceType } from '../place/place-type.js';
import { validatePlaceTypeV1 } from '../place/place-type-defaults.js';
import { catalogResolveOptions } from '@doppler-group/twinfile-core';
import { resolveExamplesRoot } from '@doppler-group/twinfile-core';

const PLACE_WIRE_SCHEMA_ID = 'https://twinfile.org/schemas/1/run/place-wire.schema.json';

export type BuildTwinfileOptions = {
  frozen?: boolean;
  writeLock?: boolean;
  /** Required for scenario builds when examples are outside the unit tree. */
  examplesRoot?: string;
  noCache?: boolean;
};

/** Alias for {@link Place} (historical name). */
export type BuildTwinfileResult = Place;

export type { PlaceFields } from '../place/built-place.js';

function processorMetaSummary(twinfile: Record<string, unknown>): Record<string, unknown> | undefined {
  const doc = ProcessorGraph.parseTwinfile(twinfile);
  if (!doc) return undefined;
  const { modules, connections } = doc.graph;
  const processorIds = modules.map((row) => row.id);
  return {
    ids: processorIds,
    processorCount: processorIds.length,
    outletCount: connections?.length ?? 0,
  };
}

function buildMeta(
  twinfile: Record<string, unknown>,
  extras?: Record<string, unknown>,
  runUnit?: boolean,
): Record<string, unknown> {
  const processorSummary = processorMetaSummary(twinfile);
  return {
    id: twinfile.id,
    name: twinfile.name,
    kind: runUnit ? 'run' : (twinfile.kind ?? 'place'),
    version: twinfile.version,
    stability: twinfile.stability,
    spec: CORE_SPEC_PIN,
    ...(processorSummary ? { processors: processorSummary } : {}),
    ...extras,
  };
}

function validatePlaceWire(wire: PlaceWireJson, fileHint: string): Result<PlaceWireJson> {
  const fn = getDefaultValidator().getSchema(PLACE_WIRE_SCHEMA_ID);
  if (!fn) {
    return err([{ code: 'E_SCHEMA', message: 'Place wire schema not registered', file: fileHint }]);
  }
  const valid = fn(wire);
  if (!valid) {
    return err(ajvErrorsToTwinErrors(fileHint, undefined, fn.errors));
  }
  return ok(wire);
}

type UnitLockInput = {
  refKey: string;
  manifestDigest: string;
  treeDigest: string;
  layerChains: string[];
};

/** `--frozen` drift check, then lock write; scene runs carry their pin in `run.expected.digest` instead. */
function syncUnitLock(unit: LoadedTwinfile, options: BuildTwinfileOptions, input: UnitLockInput): Result<void> {
  const frozen = options.frozen ?? false;
  const writeLock = options.writeLock ?? !frozen;
  const version = String(unit.twinfile.version);
  const lockRead = readTwinfileLock(unit.root);
  if (!lockRead.ok) return lockRead;

  if (frozen) {
    if (!lockRead.value) {
      return err([
        {
          code: 'E_LOCK_DRIFT',
          message: `${twinLockFileName(unit.root)} required for --frozen`,
          file: twinLockPath(unit.root),
        },
      ]);
    }
    const drift = verifyLockEntry(lockRead.value, { ...input, manifestVersion: version });
    if (drift.length > 0) return err(drift);
  }

  if (writeLock) {
    const nextLock = mergeLockEntry(lockRead.value, input.refKey, {
      version,
      twinfile: input.manifestDigest,
      tree: input.treeDigest,
      layers: input.layerChains,
    });
    writeTwinfileLock(unit.root, nextLock);
  }
  return ok(undefined);
}

export async function buildTwinfile(
  unitRoot: string,
  options: BuildTwinfileOptions = {},
): Promise<Result<Place>> {
  const loaded = loadUnitRoot(unitRoot);
  if (!loaded.ok) return loaded;

  const unit = loaded.value;
  const runUnit = isRunUnit(unit);
  if (!runUnit) {
    const geotypeErr = checkGeotypeTwinfile(unit.twinfile, unit.twinfilePath);
    if (geotypeErr) {
      return err([geotypeErr]);
    }
  }
  const builder = new TwinfileBuilder();

  let composedLayers;
  let scenarioEvents: unknown[] | undefined;
  let contracts;
  let eventBindingDocs: Record<string, unknown> = {};

  if (runUnit) {
    const examplesRoot = options.examplesRoot ?? resolveExamplesRoot(unit.root);
    if (!examplesRoot) {
      return err([
        {
          code: 'E_BUILD',
          message: 'Scenario build requires examplesRoot or TF_TWINFILE_ROOT',
          file: unit.twinfilePath,
        },
      ]);
    }
    const scenario = composeScenarioLayers(unit, {
      ...catalogResolveOptions(examplesRoot),
      placeRoot: undefined,
    });
    if (!scenario.ok) return scenario;
    composedLayers = scenario.value.layers;
    contracts = scenario.value.contracts;
    scenarioEvents = scenario.value.events;
    eventBindingDocs = scenario.value.eventBindingDocs;
  } else {
    const examplesRoot = options.examplesRoot ?? resolveExamplesRoot(unit.root);
    const resolveOpts = examplesRoot ? catalogResolveOptions(examplesRoot) : undefined;
    if (!runUnit && unit.twinfile.from && !examplesRoot) {
      return err([
        {
          code: 'E_BUILD',
          message: 'Place with from requires examplesRoot or TF_TWINFILE_ROOT',
          file: unit.twinfilePath,
        },
      ]);
    }
    const layers = composeSingleTwinfileLayers(unit, resolveOpts);
    if (!layers.ok) return layers;
    composedLayers = layers.value;
    eventBindingDocs = loadEventBindingDocuments(unit, resolveOpts);
  }

  const built = builder.build({
    layers: composedLayers,
    contracts,
    meta: buildMeta(unit.twinfile, undefined, runUnit),
    layerCache: new LayerCache({ enabled: !options.noCache }),
  });

  if (built.errors.length > 0) {
    return err(
      built.errors.map((e) => ({
        code: e.code,
        message: e.message,
        file: unit.twinfilePath,
      })),
    );
  }

  let metaExtras: Record<string, unknown> | undefined =
    built.metaExtras.resolvedArgs ?
      { resolvedArgs: built.metaExtras.resolvedArgs as Record<string, unknown> }
    : undefined;
  if (unit.twinfile.clock && typeof unit.twinfile.clock === 'object') {
    metaExtras = { ...(metaExtras ?? {}), clock: unit.twinfile.clock };
  }
  const meta = buildMeta(unit.twinfile, metaExtras, runUnit);
  const matchedBindingDocs = Object.fromEntries(
    Object.entries(built.matchedRoles).map(([forId, roles]) => [`bind/${forId}`, { for: forId, roles }]),
  );
  let mergedPlace = embedEventBindings(built.place, { ...matchedBindingDocs, ...eventBindingDocs });
  if (scenarioEvents?.length) {
    mergedPlace = { ...mergedPlace, events: scenarioEvents };
  }
  if (!runUnit) {
    const placeType = PlaceType.fromBuilt({
      twinfile: unit.twinfile,
      place: mergedPlace,
    });
    meta.placeType = placeType.toJSON();
    const validated = validatePlaceTypeV1(meta.placeType);
    if (!validated.ok) {
      return err(
        validated.errors.map((row) => ({
          ...row,
          file: unit.twinfilePath,
        })),
      );
    }
  }

  const digest = placeImageDigest({
    meta,
    place: mergedPlace,
    layers: built.layers.map((layer) => layer.chain),
  });

  const wire: PlaceWireJson = { meta, place: mergedPlace, digest };
  const wireValid = validatePlaceWire(wire, twinHeadPath(unit.root));
  if (!wireValid.ok) return wireValid;

  const manifestDigest = digestFileBytes(unit.twinfilePath);
  const { digestTwinfileTree } = await import('@doppler-group/twinfile-core');
  const treeDigest = (await digestTwinfileTree(unit.root)).treeDigest;
  const refKey = lockRefKeyFromTwinfile(unit.twinfile);

  if (!runUnit) {
    const locked = syncUnitLock(unit, options, {
      refKey,
      manifestDigest,
      treeDigest,
      layerChains: built.layers.map((l) => l.chain),
    });
    if (!locked.ok) return locked;
  }

  return ok(
    new Place({
      loaded: unit,
      data: mergedPlace,
      meta,
      digest,
      layers: built.layers,
      refKey,
      manifestDigest,
      treeDigest,
    }),
  );
}
