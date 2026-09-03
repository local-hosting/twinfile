import { describe, expect, it } from 'vitest';

import type { TwinfileLoroMap } from '@local-hosting/twinfile-core/loro';

import { StoryDocument } from '../../src/contract/narrative/contract/story-document.js';
import { storyboardStoryFixture } from './helpers/storyboard-story-fixture.js';

function memoryLoroMap(initial: Record<string, unknown> = {}): TwinfileLoroMap {
  const entries = new Map<string, unknown>(Object.entries(initial));
  return {
    get(key: string) {
      return entries.has(key) ? entries.get(key) : null;
    },
    set(key: string, value: unknown) {
      entries.set(key, value);
    },
    delete(key: string) {
      return entries.delete(key);
    },
    has(key: string) {
      return entries.has(key);
    },
    keys() {
      return [...entries.keys()];
    },
  };
}

describe('StoryDocument', () => {
  it('toJSON round-trips via fromJSON', () => {
    const source = storyboardStoryFixture();
    const doc = StoryDocument.from(source);
    const json = doc.toJSON();
    expect(json.document).toMatchObject({ id: source.id });
    const restored = StoryDocument.fromJSON(json);
    expect(restored.value.id).toBe(source.id);
  });

  it('exports onto a host map and imports the class back', () => {
    const source = storyboardStoryFixture();
    const map = memoryLoroMap();
    StoryDocument.from(source).export(map);
    expect(map.get('document')).toMatchObject({ id: source.id });
    const restored = StoryDocument.import(map);
    expect(restored.value.id).toBe(source.id);
  });
});
