import { describe, expect, it } from 'vitest';

import type { PCM } from '../../../src/contract/persona/types/pcm.js';
import { hydratePcmSignalsFromDimensions } from '../../../src/contract/persona/story/hydrate-pcm-signals-from-dimensions.js';

const basePcm: PCM = {
  version: 1,
  id: 'persona:tech-titans',
  title: 'Tech Titans',
  revision: 1,
  persona: {
    id: 'persona:tech-titans',
    label: 'Tech Titans',
    quote: 'Always on the latest gear.',
    segment: 'tech-titans',
    goals: [],
    frustrations: [],
    jobIds: [],
  },
  jobs: [],
  signalValues: {
    'attitude-tech-always-connected': 0.85,
  },
};

describe('hydratePcmSignalsFromDimensions', () => {
  it('joins AXM dimensions with PCM values', () => {
    const hydrated = hydratePcmSignalsFromDimensions(basePcm, [
      {
        id: 'attitude-tech-always-connected',
        category: 'attitude',
        group: 'tech',
        label: 'Always connected',
        unit: 'ratio',
        source: 'research',
      },
    ]);
    expect(hydrated.signals).toHaveLength(1);
    expect(hydrated.signals?.[0]).toMatchObject({
      id: 'signal:tech-titans-attitude-tech-always-connected',
      personaId: 'persona:tech-titans',
      value: 0.85,
      label: 'Always connected',
    });
  });
});
