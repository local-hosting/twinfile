import { describe, expect, it } from 'vitest';


import { createTFPlaceRuntime } from '../src/session/tf-place-runtime.js';
import {
  Place,
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';

function stormSessionFixture(): BuildTwinfileResult {
  const clock = { starts_at: '2026-06-12T09:00:00-04:00', duration: 'PT6H', step: 'PT5M' };
  const events = [
    {
      id: 'severe-weather',
      phases: ['watch', 'warning', 'all-clear'],
      args: { warningAt: { type: 'time' as const } },
    },
  ];
  return new Place({
    loaded: {
      twinfile: { clock },
      root: '/tmp',
      twinfilePath: '/tmp/unit/unit.twin.yaml',
    },
    data: {
      place: { timezone: 'America/New_York', location: { lat: 41.309, lng: -74.152 } },
      events,
    },
    meta: { clock, resolvedArgs: { warningAt: 'PT30M' } },
    digest: 'test-digest',
    layers: [],
    refKey: 'test',
    manifestDigest: 'test',
    treeDigest: 'test',
  });
}

describe('TFPlaceRuntime', () => {
  it('updates building state when weather phase boundary is crossed', () => {
    const built = stormSessionFixture();
    const runtime = createTFPlaceRuntime(built, { playheadT: 0, publishOnAdvance: false });
    expect(runtime).toBeDefined();
    if (!runtime) return;

    expect(runtime.state.weather[0]?.phase).toBeUndefined();

    const seen: number[] = [];
    runtime.observe((state) => seen.push(state.t));
    runtime.seek(1800);
    expect(runtime.state.t).toBe(1800);
    expect(runtime.state.weather[0]?.phase).toBe('warning');
    expect(seen.length).toBeGreaterThan(0);
    runtime.detach();
  });
});
