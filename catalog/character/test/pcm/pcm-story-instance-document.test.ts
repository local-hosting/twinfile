import { describe, expect, it } from 'vitest';
import { PcmStoryInstanceDocument } from '../../src/contract/persona/story/pcm-story-instance-document.js';

describe('PcmStoryInstanceDocument', () => {
  it('toJSON round-trips via fromJSON', () => {
    const instance = {
      specVersion: '1.0' as const,
      pcmId: 'persona:test',
      segmentId: 'seg',
      displayName: 'Test',
      characteristics: { traits: ['curious'] },
      createdAt: '2026-01-01T00:00:00.000Z',
      instanceId: 'char-1',
    };
    const json = PcmStoryInstanceDocument.from(instance).toJSON();
    const restored = PcmStoryInstanceDocument.fromJSON(json);
    expect(restored.value.instanceId).toBe('char-1');
  });
});
