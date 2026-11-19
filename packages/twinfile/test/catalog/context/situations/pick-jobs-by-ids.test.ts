import { describe, expect, it } from 'vitest';
import { pickJobsByIds } from '../../../../src/contract/job/pick-jobs-by-ids.js';

describe('pickJobsByIds', () => {
  it('returns jobs in mount order', () => {
    const model = {
      id: 'jsm:commute',
      label: 'Commute',
      context: 'morning',
      jobs: [
        { id: 'job:a', text: 'A', context: 'w', goal: 'w', outcome: 's' },
        { id: 'job:b', text: 'B', context: 'w', goal: 'w', outcome: 's' },
      ],
    };
    expect(pickJobsByIds(model, ['job:b', 'job:a']).map((row) => row.id)).toEqual(['job:a', 'job:b']);
  });
});
