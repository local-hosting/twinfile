import { describe, expect, it } from 'vitest';

import {
  collectJobObstacleIssues,
  JobSchema,
  MAX_OBSTACLES_PER_JOB,
  parseJob,
} from '../../../../src/contract/index.js';

const baseJob = {
  id: 'job:activate-line',
  text: 'Activate a new mobile line',
  context: 'I am adding a new mobile line',
  goal: 'to complete activation in store',
  outcome: 'I leave with a working phone',
};

describe('job obstacle contract', () => {
  it('accepts friction with obstacle: id', () => {
    const job = parseJob({
      ...baseJob,
      obstacles: [
        {
          id: 'obstacle:phone-not-set-up',
          text: 'Phone not fully set up before customer leaves',
          heart: 'adoption',
        },
      ],
    });
    expect(job.obstacles?.[0]?.text).toBe(
      'Phone not fully set up before customer leaves',
    );
    expect(
      collectJobObstacleIssues({
        id: 'obstacle:phone-not-set-up',
        text: 'Phone not fully set up before customer leaves',
      }),
    ).toEqual([]);
  });

  it('rejects desire-language obstacle text', () => {
    expect(() =>
      parseJob({
        ...baseJob,
        obstacles: [
          {
            id: 'obstacle:want-transparent-price',
            text: 'I want a transparent price with no hidden fees',
          },
        ],
      }),
    ).toThrow(/friction/);
  });

  it('rejects affect-language obstacle text', () => {
    expect(() =>
      parseJob({
        ...baseJob,
        obstacles: [
          {
            id: 'obstacle:afraid-price-jump',
            text: 'Afraid the price will jump once the promotional period ends',
          },
        ],
      }),
    ).toThrow(/affect/);
  });

  it('rejects ids without obstacle: prefix', () => {
    expect(() =>
      parseJob({
        ...baseJob,
        obstacles: [
          {
            id: 'phone-not-set-up',
            text: 'Phone not fully set up before customer leaves',
          },
        ],
      }),
    ).toThrow(/obstacle:/);
  });

  it(`rejects more than ${MAX_OBSTACLES_PER_JOB} obstacles on one job`, () => {
    const obstacles = Array.from({ length: MAX_OBSTACLES_PER_JOB + 1 }, (_, i) => ({
      id: `obstacle:blocker-${i}`,
      text: `No written confirmation of step ${i} before customer leaves`,
    }));
    expect(() => JobSchema.parse({ ...baseJob, obstacles })).toThrow(
      /at most/,
    );
  });
});
