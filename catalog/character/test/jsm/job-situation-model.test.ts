import { describe, expect, it } from 'vitest';

import { parseJobSituationModel } from '../../src/contract/situations/schemas/job-situation-model.schema.js';

describe('JobSituationModel', () => {
  it('parses a situation pack of first-class JTBD jobs', () => {
    const jsm = parseJobSituationModel({
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
          obstacles: [
            {
              id: 'obstacle:activate-phone-not-set-up',
              text: 'Phone not fully set up before customer leaves',
              heart: 'adoption',
            },
          ],
        },
      ],
    });
    expect(jsm.id).toBe('jsm:in-store-mobile-activation');
    expect(jsm.jobs[0]?.obstacles?.[0]?.text).toMatch(/Phone not fully/);
  });
});
