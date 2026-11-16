import { describe, expect, it } from 'vitest';

import { resourceShortfallMetrics, shelterResourceSupplyFromAssets } from '../src/runners/shelter-resources.js';
import { runHydraulicLines } from '../src/runners/builtin-runners.js';

describe('shelterResourceSupplyFromAssets', () => {
  it('sums cot and water capacities from ext', () => {
    const assets = [
      { ext: { shelter_resource: 'cots', capacity: 40 } },
      { ext: { shelter_resource: 'water', capacity_liters: 500 } },
    ];
    expect(shelterResourceSupplyFromAssets(assets, 'cots', false)).toBe(40);
    expect(shelterResourceSupplyFromAssets(assets, 'water', true)).toBe(500);
  });
});

describe('resourceShortfallMetrics', () => {
  it('emits shortfall when headcount exceeds supply', () => {
    const place = {
      assets: [{ ext: { shelter_resource: 'cots', capacity: 40 } }],
    };
    const metrics = resourceShortfallMetrics(place, 55, { cots: 40, water_liters: 500 });
    expect(metrics).toEqual([
      { id: 'resource_shortfall_cots', value: 15 },
      { id: 'resource_shortfall_water_liters', value: 0 },
    ]);
  });
});

describe('runHydraulicLines shelter resources', () => {
  it('includes resource shortfall metrics in jsonl', () => {
    const lines = runHydraulicLines({
      place: { spaces: [{ id: 's', roles: ['shelter'], capacity: 100 }], assets: [] },
      scenario: {
        args: { occupancy: 50, target_role: 'shelter', resources: { cots: 30 } },
      },
    });
    const metrics = lines
      .map((row) => JSON.parse(row) as { type: string; id?: string })
      .filter((row) => row.type === 'metric');
    expect(metrics.some((m) => m.id === 'resource_shortfall_cots')).toBe(true);
  });
});
