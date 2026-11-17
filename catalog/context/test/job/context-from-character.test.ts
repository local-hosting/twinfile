import { describe, expect, it } from 'vitest';
import { contextFromCharacter } from '../../src/contract/job/context-from-character.js';

describe('contextFromCharacter', () => {
  it('extracts a JobContextModel from Character jobs', () => {
    const context = contextFromCharacter({
      id: 'persona:rider',
      persona: { id: 'persona:rider', label: 'Rider' },
      jobs: [
        {
          id: 'job:commute',
          text: 'Get to work',
          context: 'weekday morning',
          goal: 'arrive on time',
          outcome: 'start the shift',
        },
      ],
    });

    expect(context).toEqual({
      id: 'context:persona:rider',
      label: 'Rider',
      context: 'Rider',
      jobs: [
        {
          id: 'job:commute',
          text: 'Get to work',
          context: 'weekday morning',
          goal: 'arrive on time',
          outcome: 'start the shift',
        },
      ],
    });
  });

  it('returns undefined when the character has no jobs', () => {
    expect(
      contextFromCharacter({
        id: 'persona:empty',
        persona: { id: 'persona:empty', label: 'Empty' },
      }),
    ).toBeUndefined();
  });
});