import { describe, expect, it } from 'vitest';

import { queryPlace } from '../../../src/catalog/place/query/place-query.js';

describe('queryPlace visits', () => {
  const sample = {
    visits: [
      { id: 'visit-arrival', kind: 'arrival', space: 'curb', order: 0 },
      { id: 'visit-shop', kind: 'activity', space: 'floor', order: 1 },
    ],
  };

  const assets = {
    assets: [
      { id: 'cot-stock', ext: { shelter_resource: 'cots', capacity: 600 } },
      { id: 'water-stock', ext: { shelter_resource: 'water', capacity_liters: 8000 } },
    ],
  };

  it('filters assets by ext.shelter_resource', () => {
    expect(queryPlace(assets, { collection: 'assets', extKey: 'shelter_resource', extValue: 'cots' }).map((r) => r.id)).toEqual([
      'cot-stock',
    ]);
    expect(queryPlace(assets, { collection: 'assets', extKey: 'shelter_resource' }).map((r) => r.id)).toEqual([
      'cot-stock',
      'water-stock',
    ]);
  });

  it('filters spaces by use mode via roles', () => {
    const place = {
      spaces: [
        { id: 'lobby', roles: ['gate'] },
        { id: 'hall', roles: ['shelter'] },
        { id: 'plaza', roles: ['outdoor', 'seating'] },
        { id: 'misc' },
      ],
    };
    expect(queryPlace(place, { mode: 'place' }).map((r) => r.id).sort()).toEqual(['hall', 'lobby', 'misc', 'plaza']);
  });

  it('queries services collection by kind and space', () => {
    const place = {
      services: [
        { id: 'svc-a', kind: 'bike_parking', space: 'cycle-lot' },
        { id: 'svc-b', kind: 'charging', space: 'ev-bay' },
      ],
    };
    expect(queryPlace(place, { collection: 'services', kind: 'charging' }).map((r) => r.id)).toEqual(['svc-b']);
    expect(queryPlace(place, { collection: 'services', space: 'cycle-lot' }).map((r) => r.id)).toEqual(['svc-a']);
  });

  it('queries visits collection by kind and space', () => {
    expect(queryPlace(sample, { collection: 'visits', kind: 'activity' }).map((r) => r.id)).toEqual([
      'visit-shop',
    ]);
    expect(queryPlace(sample, { collection: 'visits', space: 'curb' }).map((r) => r.id)).toEqual([
      'visit-arrival',
    ]);
  });
});
