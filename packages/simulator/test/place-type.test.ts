import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildTwinfile,
  buildTwinfileSummary,
  PlaceType,
  transitDisruptionControl,
  validatePlaceTypeV1,
} from '@local-hosting/twinfile-place';
import {
  loadTwinfile,
  PLACE_TYPE_SCHEMA_ID,
  validatePlaceTypeValue,
} from '@local-hosting/twinfile-core';
import { getDefaultValidator } from '@local-hosting/twinfile-core';
import { TFPlace } from '../src/types/tf-runtime.js';

import { testCatalogRoots } from '../../core/test/catalog-test-roots.js';

const importDir = dirname(fileURLToPath(import.meta.url));
const { examplesRoot, simulatorRoot } = testCatalogRoots(importDir);

function catalogPlaceRoots(root: string): string[] {
  const dirs = readdirSync(root)
    .filter(
      (name) =>
        !name.startsWith('.') &&
        !name.startsWith('base-') &&
        !name.startsWith('mixin-') &&
        !name.endsWith('-programme') &&
        name !== 'mobility-hub' &&
        !['conf', 'presets', 'fixtures', 'docs'].includes(name),
    )
    .map((name) => join(root, name));
  const mobilityCampus = join(root, 'mobility-hub', 'campus');
  if (statSync(join(mobilityCampus, 'Twinfile.yaml'), { throwIfNoEntry: false })?.isFile()) {
    dirs.push(mobilityCampus);
  }
  return dirs
    .filter((placeRoot) => statSync(placeRoot, { throwIfNoEntry: false })?.isDirectory())
    .filter((placeRoot) => statSync(join(placeRoot, 'Twinfile.yaml'), { throwIfNoEntry: false })?.isFile())
    .filter((placeRoot) => {
      const raw = readFileSync(join(placeRoot, 'Twinfile.yaml'), 'utf8');
      const kind = raw.match(/^\s*kind:\s*(\S+)/m)?.[1];
      return kind === undefined || kind === 'place';
    });
}

const examplePlaceRoots = catalogPlaceRoots(examplesRoot);

describe('PlaceType', () => {
  it('defaults signal-hub inlets when processors are omitted', () => {
    const loaded = loadTwinfile(join(examplesRoot, 'airport'));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) throw new Error('load failed');
    const pt = PlaceType.fromBuilt({ twinfile: loaded.value.twinfile });
    expect(pt.dataInlets.some((row) => row.wire === 'signal:trigger')).toBe(true);
    expect(pt.logicalOutputs.some((row) => row.id === 'place.merged')).toBe(true);
    const validated = validatePlaceTypeV1(pt.toJSON());
    expect(validated.ok).toBe(true);
  });

  it('lists transit-disruption control when plan is on the twinfile', async () => {
    const path = join(examplesRoot, 'airport');
    const built = await buildTwinfile(path, {
      examplesRoot,
      simulatorRoot,
            writeLock: false,
            noCache: true,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) throw new Error('build failed');
    const placeType = built.value.meta.placeType;
    expect(placeType).toBeDefined();
    const pt = PlaceType.fromJSON(placeType);
    expect(pt?.acceptsControl('transit-disruption')).toBe(true);
    const card = buildTwinfileSummary({
      twinfile: built.value.loaded.twinfile,
      digest: built.value.digest,
      place: built.value.data as Record<string, unknown>,
    });
    expect(card.io.inputs.some((row) => row.id.startsWith('control.'))).toBe(false);
    expect(card.io.inputs.some((row) => row.kind === 'signal:trigger')).toBe(true);
    expect(card.io.outputs.some((row) => row.id === 'place:merged')).toBe(false);
    expect(card.io.outputs.some((row) => row.id === 'signal:occupancy')).toBe(true);
    expect(card.io.outputs.some((row) => row.id === 'signal:status')).toBe(true);
    expect(pt?.logicalOutputs.some((row) => row.id === 'place.merged')).toBe(true);
  });

  it('rejects placeType missing place.merged (JSON Schema)', () => {
    const invalid = {
      schema: 'twinfile.place-type.v1',
      controls: [],
      dataInlets: [],
      dataOutlets: [],
      logicalOutputs: [],
    };
    const validated = validatePlaceTypeValue(getDefaultValidator(), invalid);
    expect(validated.ok).toBe(false);
    expect(PLACE_TYPE_SCHEMA_ID).toContain('place-type.schema.json');
  });

  it.each(examplePlaceRoots.map((path) => [path.replace(/.*[/\\]/, ''), path] as const))(
    'catalog place %s build emits JSON Schema–valid placeType',
    async (_name, placeRoot) => {
      const built = await buildTwinfile(placeRoot, {
        examplesRoot,
        simulatorRoot,
                writeLock: false,
                noCache: true,
      });
      expect(built.ok, placeRoot).toBe(true);
      if (!built.ok) return;
      const placeType = built.value.meta.placeType;
      expect(placeType).toBeDefined();
      expect(validatePlaceTypeV1(placeType).ok).toBe(true);
      const row = placeType as { logicalOutputs?: { id: string }[]; controls?: { id: string }[] };
      expect(row.logicalOutputs?.some((o) => o.id === 'place.merged')).toBe(true);
      const hasTriggerSurface =
        row.dataInlets?.some((i) => i.wire === 'signal:trigger') ||
        row.controls?.some((c) => c.wire === 'signal:trigger');
      expect(hasTriggerSurface).toBe(true);

      const contractPath = join(placeRoot, 'expected/contract.json');
      if (!existsSync(contractPath)) return;
      const contract = JSON.parse(readFileSync(contractPath, 'utf8')) as {
        bindings?: Array<{ for?: string }>;
      };
      for (const plan of contract.bindings ?? []) {
        if (typeof plan.for !== 'string') continue;
        expect(row.controls?.some((c) => c.id === plan.for), plan.for).toBe(true);
      }
    },
    60_000,
  );

  it('TFPlace.hostSurface() matches build meta and drives summary io', async () => {
    const built = await buildTwinfile(join(examplesRoot, 'shop'), {
      examplesRoot,
      simulatorRoot,
      writeLock: false,
      noCache: true,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const place = TFPlace.compose(built.value);
    const pt = place.hostSurface();
    expect(pt).toBeDefined();
    const fromBuilt = PlaceType.fromBuilt({
      twinfile: built.value.loaded.twinfile,
      place: built.value.data,
    });
    expect(pt!.toJSON()).toEqual(fromBuilt.toJSON());
    const summary = buildTwinfileSummary({
      twinfile: built.value.loaded.twinfile,
      place: built.value.data,
      digest: built.value.digest,
      placeType: built.value.meta.placeType,
    });
    expect(summary.io.outputs.some((row) => row.kind === 'signal:occupancy')).toBe(true);
  });

  it('validates transit control payloads', () => {
    const okPayload = transitDisruptionControl.parsePayload({
      control: 'transit-disruption',
      phase: 'disrupted',
      line: 'shuttle-a-b',
    });
    expect(okPayload.ok).toBe(true);
    const bad = transitDisruptionControl.parsePayload({ control: 'other', phase: 'disrupted' });
    expect(bad.ok).toBe(false);
  });
});
