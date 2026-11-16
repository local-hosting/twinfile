import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildTwinfile,
} from '@local-hosting/twinfile-place';
import {
  loadRunUnit,
} from '@local-hosting/twinfile-core';
import { createRunPayload } from '@local-hosting/twinfile-simulator';
import { createClock } from '@local-hosting/twinfile-simulator';
import { loadFeedRows, resolveTrackFeeds } from '@local-hosting/twinfile-simulator';
import { createTimeline } from '@local-hosting/twinfile-simulator';
import type { TimelinePayload } from '@local-hosting/twinfile-simulator';
import { goldenSceneRun, testExamplesRoot } from '../../core/test/catalog-test-roots.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

function tempFeed(name: string, body: string): string {
  const path = join(mkdtempSync(join(tmpdir(), 'twin-feed-')), name);
  writeFileSync(path, body);
  return path;
}

describe('createClock', () => {
  it('rejects a start time without a UTC offset', () => {
    expect(() => createClock({ starts_at: '2026-06-12T09:00:00', duration: 'PT1H', step: 'PT1M' })).toThrow(
      /explicit UTC offset/,
    );
  });

  it('rejects a step longer than the run and runs with too many steps', () => {
    const starts_at = '2026-06-12T09:00:00-04:00';
    expect(() => createClock({ starts_at, duration: 'PT1M', step: 'PT1H' })).toThrow(/longer than/);
    expect(() => createClock({ starts_at, duration: 'P30D', step: 'PT1S' })).toThrow(/max/);
  });
});

describe('createTimeline', () => {
  const mergedPlace = {
    tracks: [{ id: 'footfall', source: 'curve' as const, points: { '07:00': 0.1, '18:00': 1 } }],
    schedules: [{ id: 'truck', when: 'Mo-Su 06:00-06:45', variance: { start: 'PT15M' } }],
  };
  const clock = { starts_at: '2026-06-12T05:00:00-04:00', duration: 'PT3H', step: 'PT5M' };

  it('gives the same sample when scrubbing back as when playing forward', () => {
    const timeline = createTimeline({ clock, timezone: 'America/New_York', mergedPlace, seed: 3 });
    const forward = timeline.samples();
    for (const sample of [...forward].reverse()) {
      expect(timeline.at(sample.t)).toEqual(sample);
    }
  });

  it('timeline samples use the place layout id', () => {
    const modes = (phaseStarts?: Record<string, number>) =>
      createTimeline({ clock, timezone: 'America/New_York', mergedPlace, phaseStarts })
        .samples()
        .map((s) => s.mode);
    expect(new Set(modes())).toEqual(new Set(['place']));
    expect(new Set(modes({ warning: 3600 }))).toEqual(new Set(['place']));
  });

  it('keeps schedule lateness fixed per seed', () => {
    const lateness = (seed: number) =>
      createTimeline({ clock, timezone: 'America/New_York', mergedPlace, seed })
        .samples()
        .find((s) => s.active.length > 0)?.active[0]?.starts_at;
    expect(lateness(3)).toBe(lateness(3));
  });

  it('keeps local schedule times across the spring DST change', () => {
    const daily = { schedules: [{ id: 'open', when: 'Mo-Su 06:00-07:00' }] };
    const before = createTimeline({
      clock: { starts_at: '2026-03-07T06:30:00-05:00', duration: 'PT1M', step: 'PT1M' },
      timezone: 'America/New_York',
      mergedPlace: daily,
    });
    const after = createTimeline({
      clock: { starts_at: '2026-03-08T06:30:00-04:00', duration: 'PT1M', step: 'PT1M' },
      timezone: 'America/New_York',
      mergedPlace: daily,
    });
    expect(before.at(0).active.map((a) => a.id)).toEqual(['open']);
    expect(after.at(0).active.map((a) => a.id)).toEqual(['open']);
  });

  it('fails when a solar track has no place location', () => {
    expect(() =>
      createTimeline({ clock, timezone: 'America/New_York', mergedPlace: { tracks: [{ id: 'sun', source: 'solar' }] } }),
    ).toThrow(/place.location/);
  });
});

describe('feeds', () => {
  it('rejects rows that would silently skew a run', () => {
    expect(() => loadFeedRows(tempFeed('a.csv', 't,stage\n0,1\n'))).toThrow(/JSON Lines/);
    expect(() =>
      loadFeedRows(tempFeed('b.jsonl', '{"device_id":"g","observed_property":"stage","observed_at":"2026-06-12T09:00:00Z"}\n')),
    ).toThrow(/b\.jsonl:1: missing value/);
    expect(() =>
      loadFeedRows(
        tempFeed('c.jsonl', '{"device_id":"g","observed_property":"stage","value":1,"observed_at":"2026-06-12T09:00:00"}\n'),
      ),
    ).toThrow(/explicit UTC offset/);
  });

  it('fails when a feed track points at a device that does not exist', () => {
    expect(() =>
      resolveTrackFeeds({
        mergedPlace: { gauges: [] },
        tracks: [{ id: 'stage', source: 'feed', device: 'missing', property: 'stage' }],
        placeRoot: '.',
      }),
    ).toThrow(/not a sensor or gauge/);
  });
});

describe('createRunPayload', () => {
  it('adds a timeline for the river scenario', async () => {
    const dir = goldenSceneRun(dirname(fileURLToPath(import.meta.url)), 'river-until-stage-unsafe');
    const built = await buildTwinfile(dir, { examplesRoot, writeLock: false });
    const loaded = loadRunUnit(dir);
    if (!built.ok || !loaded.ok) throw new Error('river scenario failed to build');

    const resolvedArgs =
      (built.value.meta as { resolvedArgs?: Record<string, unknown> }).resolvedArgs ?? {};
    const payload = createRunPayload({
      built: built.value,
      layers: built.value.layers,
      twinfile: loaded.value.twinfile,
      runName: 'until-stage-unsafe',
      args: { ...resolvedArgs, track: 'stage', threshold: 10 },
      placeRoot: join(examplesRoot, 'river'),
      seed: 1,
    });
    const timeline = payload.timeline as TimelinePayload;
    expect(timeline.samples).toHaveLength(31);
    expect(timeline.units.stage).toBe('m');
    expect(timeline.samples[12]?.tracks.stage).toBeCloseTo(10.18, 6);
    expect(timeline.samples[12]?.known.stage).toBe(9.5);
  });
});
