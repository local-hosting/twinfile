import { describe, expect, it } from 'vitest';

import { sampleCoverageGraphV0 } from '@local-hosting/twinfile/simulator';
import { resolveTrackFeeds } from '@local-hosting/twinfile/simulator';
import { createTimeline } from '@local-hosting/twinfile/simulator';

const coverageFixture = {
  spaces: [
    { id: 'ap-room', kind: 'room', exposure: 'indoor' },
    { id: 'hall', kind: 'corridor', exposure: 'indoor' },
    { id: 'yard', kind: 'yard', exposure: 'outdoor' },
  ],
  assets: [
    { id: 'ap', kind: 'network', space: 'ap-room', radio: { protocol: 'wifi', tx_power_dbm: 20 } },
  ],
  routes: [
    { id: 'r1', from: 'ap-room', to: 'hall', length_m: 10, kind: 'corridor', step_free: true },
  ],
  openings: [{ id: 'o1', kind: 'door', connects: ['hall', 'yard'], width_m: 2, state: 'open' }],
  tracks: [
    { id: 'served-ap', source: 'coverage', radio: 'ap', space: 'ap-room', metric: 'served' },
    { id: 'served-yard', source: 'coverage', radio: 'ap', space: 'yard', metric: 'served', threshold_dbm: -75 },
    { id: 'rssi-yard', source: 'coverage', radio: 'ap', space: 'yard', metric: 'rssi_dbm' },
  ],
} as const;

describe('coverage graph-v0', () => {
  it('serves the AP space and not a distant outdoor space', () => {
    expect(
      sampleCoverageGraphV0({
        mergedPlace: coverageFixture,
        radioAssetId: 'ap',
        targetSpaceId: 'ap-room',
        metric: 'served',
      }),
    ).toBe(1);
    expect(
      sampleCoverageGraphV0({
        mergedPlace: coverageFixture,
        radioAssetId: 'ap',
        targetSpaceId: 'yard',
        metric: 'served',
        thresholdDbm: -75,
      }),
    ).toBe(0);
  });

  it('samples on the timeline with known equal to tracks', () => {
    const clock = { starts_at: '2026-06-12T09:00:00-04:00', duration: 'PT1H', step: 'PT30M' };
    const timeline = createTimeline({
      clock,
      timezone: 'America/New_York',
      mergedPlace: coverageFixture,
      seed: 1,
    });
    const sample = timeline.at(0);
    expect(sample.tracks['served-ap']).toBe(1);
    expect(sample.tracks['served-yard']).toBe(0);
    expect(sample.known['served-yard']).toBe(0);
    expect(sample.tracks['rssi-yard']).toBeCloseTo(-82.38, 2);
  });
});

describe('coliving wifi expectation vs probe feed', () => {
  it('marks pool deck unserved while coworking wing is served', () => {
    const place = {
      spaces: [
        { id: 'work-create-wing', kind: 'workspace', exposure: 'indoor' },
        { id: 'amenity-spine', kind: 'concourse', exposure: 'covered' },
        { id: 'pool-garden', kind: 'pool', exposure: 'outdoor' },
      ],
      assets: [
        {
          id: 'wifi-hub-work',
          kind: 'network',
          space: 'work-create-wing',
          radio: { protocol: 'wifi', tx_power_dbm: 20 },
        },
      ],
      openings: [
        {
          id: 'door-spine-work',
          kind: 'door',
          connects: ['amenity-spine', 'work-create-wing'],
          width_m: 2,
          state: 'open',
        },
        {
          id: 'gate-spine-pools',
          kind: 'gate',
          connects: ['amenity-spine', 'pool-garden'],
          width_m: 4,
          state: 'open',
        },
      ],
      sensors: [
        {
          id: 'probe-work-desk',
          observes: 'work-create-wing',
          space: 'work-create-wing',
          properties: ['rssi_dbm'],
          simulate: { every: 'PT15M', rssi_dbm: { baseline: -58, noise: 2 } },
        },
      ],
      tracks: [
        {
          id: 'wifi-served-work',
          source: 'coverage',
          radio: 'wifi-hub-work',
          space: 'work-create-wing',
          metric: 'served',
        },
        {
          id: 'wifi-served-pool',
          source: 'coverage',
          radio: 'wifi-hub-work',
          space: 'pool-garden',
          metric: 'served',
        },
        {
          id: 'probe-rssi',
          source: 'feed',
          device: 'probe-work-desk',
          property: 'rssi_dbm',
          interpolate: 'step',
        },
      ],
    };

    const clock = { starts_at: '2026-06-12T09:00:00-04:00', duration: 'PT1H', step: 'PT15M' };
    const feeds = resolveTrackFeeds({
      mergedPlace: place,
      tracks: place.tracks,
      placeRoot: '.',
      clock,
      seed: 4,
    });
    const timeline = createTimeline({
      clock,
      timezone: 'America/New_York',
      mergedPlace: place,
      feeds,
      seed: 4,
    });
    const sample = timeline.at(0);
    expect(sample.tracks['wifi-served-work']).toBe(1);
    expect(sample.tracks['wifi-served-pool']).toBe(0);
    expect(sample.tracks['probe-rssi']).toBeCloseTo(-59.66, 1);
    expect(sample.known['probe-rssi']).toBe(sample.tracks['probe-rssi']);
  });
});
