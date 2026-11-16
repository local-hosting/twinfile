import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildTwinfile,
} from '@doppler-group/twinfile-place';
import {
  loadRunUnit,
} from '@doppler-group/twinfile-core';
import { runReplayLines } from '@doppler-group/twinfile-core';
import { createRunPayload } from '@doppler-group/twinfile-simulator';
import { loadFeedRows, resolveTrackFeeds } from '@doppler-group/twinfile-simulator';
import { pullFeedRows, feedRowsToJsonl } from '@doppler-group/twinfile-simulator';
import { goldenSceneRunDir, testExamplesRoot } from '../../core/test/catalog-test-roots.js';

const importDir = dirname(fileURLToPath(import.meta.url));
const examplesRoot = testExamplesRoot(importDir);

const sensorthings = {
  value: [
    { phenomenonTime: '2026-06-12T13:00:00Z', resultTime: '2026-06-12T13:02:00Z', result: 4.2 },
    { phenomenonTime: '2026-06-12T13:05:00Z', resultTime: '2026-06-12T13:07:00Z', result: 7.8 },
    { phenomenonTime: '2026-06-12T13:10:00Z', resultTime: '2026-06-12T13:12:00Z', result: 9.5 },
    { phenomenonTime: '2026-06-12T13:15:00Z', resultTime: '2026-06-12T13:17:00Z', result: 11.2 },
    { phenomenonTime: '2026-06-12T13:20:00Z', resultTime: '2026-06-12T13:22:00Z', result: 10.1 },
  ],
};

describe('feed pull', () => {
  it('writes SensorThings rows a replay scenario can run without changing the scenario', async () => {
    const scenarioDir = goldenSceneRunDir(importDir, 'river-until-stage-unsafe');
    const before = readFileSync(join(scenarioDir, 'run.yaml'), 'utf8');
    const rows = await pullFeedRows(
      {
        protocol: 'sensorthings',
        url: 'https://example.test/Observations',
        deviceId: 'gauge-upstream',
        observedProperty: 'stage',
        unit: 'm',
      },
      async () => ({ ok: true, status: 200, json: async () => sensorthings }),
    );
    expect(rows[0]).toMatchObject({
      device_id: 'gauge-upstream',
      observed_property: 'stage',
      value: 4.2,
      available_at: '2026-06-12T13:02:00Z',
    });

    const placeRoot = mkdtempSync(join(tmpdir(), 'twin-pull-'));
    const feedPath = join(placeRoot, 'sources/gauges/upstream.jsonl');
    mkdirSync(join(placeRoot, 'sources/gauges'), { recursive: true });
    mkdirSync(join(placeRoot, 'sources/lab'), { recursive: true });
    writeFileSync(feedPath, feedRowsToJsonl(rows));
    writeFileSync(
      join(placeRoot, 'sources/lab/eddy-pool.jsonl'),
      readFileSync(join(examplesRoot, 'river/sources/lab/eddy-pool.jsonl')),
    );
    expect(loadFeedRows(feedPath)[3]?.value).toBe(11.2);

    const built = await buildTwinfile(scenarioDir, { examplesRoot, writeLock: false });
    const loaded = loadRunUnit(scenarioDir);
    if (!built.ok || !loaded.ok) throw new Error('river scenario failed to build');
    const resolvedArgs = (built.value.meta as { resolvedArgs?: Record<string, unknown> }).resolvedArgs ?? {};
    const payload = createRunPayload({
      built: built.value,
      layers: built.value.layers,
      twinfile: loaded.value.twinfile,
      runName: 'until-stage-unsafe',
      args: { ...resolvedArgs, track: 'stage', threshold: 10 },
      placeRoot,
      seed: 1,
    });
    const lines = runReplayLines(payload as Parameters<typeof runReplayLines>[0]);
    expect(lines.some((line) => line.includes('"time_until_unsafe_s"'))).toBe(true);
    expect(readFileSync(join(scenarioDir, 'run.yaml'), 'utf8')).toBe(before);
  });

  it('samples a sensorthings device from its replay file', () => {
    const placeRoot = mkdtempSync(join(tmpdir(), 'twin-replay-'));
    const feedPath = join(placeRoot, 'stage.jsonl');
    writeFileSync(
      feedPath,
      feedRowsToJsonl([
        {
          device_id: 'gauge-upstream',
          observed_property: 'stage',
          value: 4.2,
          observed_at: '2026-06-12T13:00:00Z',
          available_at: '2026-06-12T13:02:00Z',
        },
      ]),
    );
    const rows = resolveTrackFeeds({
      mergedPlace: {
        gauges: [{ id: 'gauge-upstream', feed: { protocol: 'sensorthings', url: 'https://example.test', replay: 'stage.jsonl' } }],
      },
      tracks: [{ id: 'stage', source: 'feed', device: 'gauge-upstream', property: 'stage' }],
      placeRoot,
    });
    expect(rows).toHaveLength(1);
  });

  it('maps an NGSI-LD property onto the same row shape', async () => {
    const rows = await pullFeedRows(
      { protocol: 'ngsi-ld', url: 'https://example.test/entities', deviceId: 'gauge-upstream', observedProperty: 'stage', unit: 'm' },
      async () => ({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'urn:ngsi-ld:Device:gauge',
            dateModified: '2026-06-12T13:02:00Z',
            stage: { type: 'Property', value: 4.2, observedAt: '2026-06-12T13:00:00Z' },
          },
        ],
      }),
    );
    expect(rows[0]).toMatchObject({
      device_id: 'gauge-upstream',
      value: 4.2,
      observed_at: '2026-06-12T13:00:00Z',
      available_at: '2026-06-12T13:02:00Z',
    });
  });
});
