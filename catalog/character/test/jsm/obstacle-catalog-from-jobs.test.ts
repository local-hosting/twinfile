import { describe, expect, it } from 'vitest';

import {
  obstacleCatalogFromJobs,
  parseJob,
  parseObstacleCatalog,
} from '../../src/contract/situations/index.js';
import { obstacleCatalogFromJobs as obstacleCatalogFromJobsBrowser } from '../../src/contract/situations/browser.js';

const activateLine = parseJob({
  id: 'job:activate-line',
  text: 'Activate a new mobile line',
  when: 'I am adding a new mobile line',
  want: 'to complete activation in store',
  so: 'I leave with a working phone',
  obstacles: [
    {
      id: 'obstacle:phone-not-set-up',
      text: 'Phone not fully set up before customer leaves',
      heart: 'adoption',
    },
    {
      id: 'obstacle:long-queue',
      text: 'Queue at the counter runs past twenty minutes',
      removable: false,
    },
  ],
});

const payBill = parseJob({
  id: 'job:pay-bill',
  text: 'Pay my monthly bill',
  when: 'my bill is due',
  want: 'to pay it quickly',
  so: 'my service stays on',
});

describe('obstacleCatalogFromJobs', () => {
  it('flattens job-nested obstacles into catalog rows linked to the parent job', () => {
    const catalog = obstacleCatalogFromJobs([activateLine, payBill]);

    expect(catalog).toEqual({
      specVersion: '1.0',
      obstacles: [
        {
          id: 'obstacle:phone-not-set-up',
          label: 'Phone not fully set up before customer leaves',
          jobId: 'job:activate-line',
          removable: true,
          heartDimensionId: 'adoption',
        },
        {
          id: 'obstacle:long-queue',
          label: 'Queue at the counter runs past twenty minutes',
          jobId: 'job:activate-line',
          removable: false,
        },
      ],
    });
  });

  it('keeps the first job for an obstacle id shared across jobs', () => {
    const shared = activateLine.obstacles?.[0];
    if (!shared) throw new Error('fixture missing obstacle');
    const catalog = obstacleCatalogFromJobs([
      activateLine,
      { ...payBill, obstacles: [shared] },
    ]);

    expect(catalog.obstacles.map((row) => [row.id, row.jobId])).toEqual([
      ['obstacle:phone-not-set-up', 'job:activate-line'],
      ['obstacle:long-queue', 'job:activate-line'],
    ]);
    expect(parseObstacleCatalog(catalog)).toEqual(catalog);
  });

  it('is exported from the browser entry', () => {
    expect(typeof obstacleCatalogFromJobsBrowser).toBe('function');
    expect(obstacleCatalogFromJobsBrowser).toBe(obstacleCatalogFromJobs);
  });
});
