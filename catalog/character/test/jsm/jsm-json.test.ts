import { describe, expect, it } from 'vitest';

import { jsmFromJSON, jsmToJSON } from '../../src/contract/situations/contract/json.js';
import type { JobSituationModel } from '../../src/contract/situations/types/job-situation-model.js';

const sample: JobSituationModel = {
  id: 'jsm:in-store-mobile-activation',
  label: 'In-store mobile activation',
  situation: 'I am in a retail store activating a new mobile line',
  revision: 1,
  jobs: [
    {
      id: 'job:activate-a-new-mobile-line',
      text: 'Activate a new mobile line',
      when: 'I am adding a new mobile line',
      want: 'understand the plan options and complete the activation',
      so: 'I leave with a working phone and know my new monthly cost',
    },
  ],
};

describe('jsm json', () => {
  it('round-trips toJSON/fromJSON', () => {
    const restored = jsmFromJSON(jsmToJSON(sample));
    expect(restored.id).toBe(sample.id);
    expect(restored.jobs).toHaveLength(1);
    expect(restored.jobs[0]?.want).toMatch(/plan options/);
  });
});
