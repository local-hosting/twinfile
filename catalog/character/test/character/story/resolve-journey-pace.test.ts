import { describe, expect, it } from 'vitest';
import {
  normalizeJourneyPaceId,
  resolveCharacterJourneyPace,
  resolvePlanningSegmentJourneyPace,
  resolveSegmentJourneyPaceFromCharacters,
} from '../../../src/contract/character/story/resolve-journey-pace.js';

describe('resolve-journey-pace', () => {
  it('normalizes persona and planning segment pace', () => {
    expect(resolveCharacterJourneyPace({ journeyPace: 'fast' })).toBe('fast');
    expect(
      resolvePlanningSegmentJourneyPace({
        overview: { journeyPace: 'SLOW' },
      }),
    ).toBe('slow');
    expect(normalizeJourneyPaceId('invalid')).toBeUndefined();
  });

  it('resolves pace from personas sharing a segment id', () => {
    const pace = resolveSegmentJourneyPaceFromCharacters(
      [
        { segment: 'segment:commuter', journeyPace: 'medium' },
        { segment: 'segment:driver', journeyPace: 'fast' },
      ],
      'driver',
    );
    expect(pace).toBe('fast');
  });
});
