import { describe, expect, it } from 'vitest';
import {
  isTechnicalStoryIdentityLabel,
  resolveHumanProtagonistNameWithPcm,
} from '../../../src/contract/narrative/brief/protagonist-identity.js';

describe('isTechnicalStoryIdentityLabel', () => {
  it('flags instance slugs', () => {
    expect(isTechnicalStoryIdentityLabel('rider-urban-commuter-3')).toBe(true);
    expect(isTechnicalStoryIdentityLabel('Maya')).toBe(false);
    expect(isTechnicalStoryIdentityLabel('persona:rider')).toBe(false);
  });
});

describe('resolveHumanProtagonistNameWithPcm', () => {
  it('prefers exemplar over technical instance displayName', () => {
    const name = resolveHumanProtagonistNameWithPcm({
      snapshot: {
        storyId: 'rider-urban-commuter-3',
        personaId: 'rider-urban-commuter-3',
        who: { displayName: 'rider-urban-commuter-3', pcmId: 'persona:rider' },
      },
      focalPcm: {
        id: 'persona:rider',
        persona: {
          id: 'persona:rider',
          label: 'Urban rider',
          exemplar: { name: 'Maya', age: 32 },
        },
      } as never,
    });
    expect(name).toBe('Maya');
  });
});
