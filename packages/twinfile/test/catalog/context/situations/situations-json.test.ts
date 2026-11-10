import { describe, expect, it } from 'vitest';

import { situationsFromJSON, situationsToJSON } from '../../../../src/catalog/context/contract/contract/json.js';
import type { JobContextModel } from '../../../../src/catalog/context/contract/types/job-context-model.js';

const sample: JobContextModel = {
  id: 'jsm:in-store-mobile-activation',
  label: 'In-store mobile activation',
  context: 'I am in a retail store activating a new mobile line',
  revision: 1,
  jobs: [
    {
      id: 'job:activate-a-new-mobile-line',
      text: 'Activate a new mobile line',
      context: 'I am adding a new mobile line',
      goal: 'understand the plan options and complete the activation',
      outcome: 'I leave with a working phone and know my new monthly cost',
    },
  ],
};

describe('situations json', () => {
  it('round-trips toJSON/fromJSON', () => {
    const restored = situationsFromJSON(situationsToJSON(sample));
    expect(restored.id).toBe(sample.id);
    expect(restored.jobs).toHaveLength(1);
    expect(restored.jobs[0]?.goal).toMatch(/plan options/);
  });
});
