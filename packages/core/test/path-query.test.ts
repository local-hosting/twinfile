import { describe, expect, it } from 'vitest';

import { queryPath } from '../src/query/path-query.js';

const place = {
  spaces: [{ id: 'lobby' }, { id: 'hall', roles: ['shelter'] }, { id: 'roof' }],
  openings: [{ id: 'door', kind: 'door', connects: ['lobby', 'hall'], width_m: 1, state: 'closed' }],
  routes: [
    { id: 'stair', from: 'lobby', to: 'roof', length_m: 4, kind: 'stair', step_free: false },
    { id: 'ramp', from: 'lobby', to: 'roof', length_m: 12, kind: 'ramp', step_free: true },
  ],
};

describe('queryPath', () => {
  it('drops a path when the opening is closed and refuses a stair when step_free', () => {
    const blocked = queryPath(place, { from: 'lobby', to: 'hall' });
    expect(blocked.mode === 'path' ? blocked.path : undefined).toBeNull();

    const opened = {
      ...place,
      openings: [{ ...place.openings[0]!, state: 'open' }],
    };
    expect(queryPath(opened, { from: 'lobby', to: 'hall' })).toEqual({
      mode: 'path',
      path: { spaces: ['lobby', 'hall'], openings: ['door'], routes: [], length_m: 0 },
    });

    const direct = queryPath(place, { from: 'lobby', to: 'roof' });
    expect(direct.mode === 'path' ? direct.path?.routes : []).toEqual(['stair']);
    const stepFree = queryPath(place, { from: 'lobby', to: 'roof', step_free: true });
    expect(stepFree.mode === 'path' ? stepFree.path?.routes : []).toEqual(['ramp']);
    expect(stepFree.mode === 'path' ? stepFree.path?.length_m : 0).toBe(12);

    expect(queryPath(place, { role: 'shelter' })).toEqual({
      mode: 'reachable',
      role: 'shelter',
      spaces: ['hall'],
    });
  });
});
