import { describe, expect, it } from 'vitest';


import { createTFPlaceSession } from '@doppler-group/twinfile-simulator';
import {
  Place,
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';

function stormSessionFixture(): BuildTwinfileResult {
  const clock = { starts_at: '2026-06-12T09:00:00-04:00', duration: 'PT6H', step: 'PT5M' };
  const situations = [
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
      twinfilePath: '/tmp/Twinfile.yaml',
    },
    data: {
      place: { timezone: 'America/New_York', location: { lat: 41.309, lng: -74.152 } },
      situations,
    },
    meta: { clock, resolvedArgs: { warningAt: 'PT30M' } },
    digest: 'test-digest',
    layers: [],
    refKey: 'test',
    manifestDigest: 'test',
    treeDigest: 'test',
  });
}

describe('TFPlaceSession', () => {
  it('wires session bus, message bus, and weather programmes', () => {
    const built = stormSessionFixture();
    const session = createTFPlaceSession(built, { playheadT: 0, publishOnAdvance: false });
    expect(session).toBeDefined();
    if (!session) return;

    expect(session.place.clock).toEqual(built.meta.clock);
    expect(session.weathers.length).toBe(1);
    expect(session.weathers[0]?.id).toBe('severe-weather');
    expect(session.messages.publish).toBeTypeOf('function');
    expect(session.messages.subscribe).toBeTypeOf('function');

    const notes: number[] = [];
    session.session.on('note', (note) => notes.push(note.t));
    session.seek(3600);
    expect(notes.length).toBeGreaterThan(0);
    session.detach();
  });
});
