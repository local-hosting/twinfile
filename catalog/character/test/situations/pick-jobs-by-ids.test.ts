import { describe, expect, it } from 'vitest';
import { pickJobsByIds } from '../../src/contract/situations/job/pick-jobs-by-ids.js';

describe('pickJobsByIds', () => {
  it('returns jobs in mount order', () => {
    const model = {
      id: 'jsm:commute',
      label: 'Commute',
      situation: 'morning',
      jobs: [
        { id: 'job:a', text: 'A', when: 'w', want: 'w', so: 's' },
        { id: 'job:b', text: 'B', when: 'w', want: 'w', so: 's' },
      ],
    };
    expect(pickJobsByIds(model, ['job:b', 'job:a']).map((row) => row.id)).toEqual(['job:a', 'job:b']);
  });
});
