import { describe, expect, it } from 'vitest';

import { parseJobContextModel } from '../../src/contract/schemas/job-context-model.schema.js';

describe('JobContextModel', () => {
  it('parses a context pack of first-class JTBD jobs', () => {
    const jsm = parseJobContextModel({
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
