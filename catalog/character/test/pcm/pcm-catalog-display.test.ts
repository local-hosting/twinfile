import { describe, expect, it } from 'vitest';
import {
  pcmCatalogId,
  pcmCatalogLabel,
  pcmCatalogSegment,
} from '../../src/contract/persona/contract/pcm-catalog-display.js';
import { resolvePcmPersonaDisplayName } from '../../src/contract/persona/persona/resolve-persona-display-name.js';
import type { PCM } from '../../src/contract/persona/types/pcm.js';

const sample: PCM = {
  id: 'persona:rider',
  title: 'Rider title',
  version: 1,
  revision: 1,
  persona: {
    id: 'persona:rider',
    label: 'Alex Rider',
    segment: 'segment:commute',
    quote: '',
    goals: [],
    frustrations: [],
    jobIds: [],
  },
};

describe('pcm catalog display helpers', () => {
  it('pcmCatalogId prefers persona.id', () => {
    expect(pcmCatalogId(sample)).toBe('persona:rider');
  });

  it('pcmCatalogLabel prefers persona label', () => {
    expect(pcmCatalogLabel(sample)).toBe('Alex Rider');
  });

  it('pcmCatalogSegment reads persona segment', () => {
    expect(pcmCatalogSegment(sample)).toBe('segment:commute');
  });

  it('resolvePcmPersonaDisplayName honors override', () => {
    expect(resolvePcmPersonaDisplayName(sample, 'Custom')).toBe('Custom');
    expect(resolvePcmPersonaDisplayName(sample)).toBe('Alex Rider');
  });
});
