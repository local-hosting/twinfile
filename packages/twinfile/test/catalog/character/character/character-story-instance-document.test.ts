import { describe, expect, it } from 'vitest';
import { CharacterStoryInstanceDocument } from '../../../../src/contract/character/story/character-story-instance-document.js';

describe('CharacterStoryInstanceDocument', () => {
  it('toJSON round-trips via fromJSON', () => {
    const instance = {
      specVersion: '1.0' as const,
      characterId: 'persona:test',
      segmentId: 'seg',
      displayName: 'Test',
      characteristics: { traits: ['curious'] },
      createdAt: '2026-01-01T00:00:00.000Z',
      instanceId: 'char-1',
    };
    const json = CharacterStoryInstanceDocument.from(instance).toJSON();
    const restored = CharacterStoryInstanceDocument.fromJSON(json);
    expect(restored.value.instanceId).toBe('char-1');
  });
});
