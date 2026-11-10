import { describe, expect, it } from 'vitest';

import { storyFromJSON, storyToJSON } from '../../../../src/catalog/story/contract/narrative/contract/json.js';
import { parseStory } from '../../../../src/catalog/story/contract/narrative/schemas/story-narrative.schema.js';
import {
  STORY_NARRATIVE_SPEC_VERSION,
  storyNarrativeSpecVersion,
} from '../../../../src/catalog/story/contract/narrative/types/story-narrative-spec.js';
import { storyboardStoryFixture } from './helpers/storyboard-story-fixture.js';

describe('story narrative spec', () => {
  it('defaults spec version when omitted', () => {
    const { version: _version, ...body } = storyboardStoryFixture();
    const story = parseStory(body);
    expect(story.version).toBe(STORY_NARRATIVE_SPEC_VERSION);
    expect(storyNarrativeSpecVersion(story)).toBe(1);
  });

  it('accepts storySpec on disk alias', () => {
    const { version: _version, ...body } = storyboardStoryFixture();
    const story = parseStory({ storySpec: 1, ...body });
    expect(story.version).toBe(1);
  });

  it('rejects conflicting storySpec and version', () => {
    const { version: _version, ...body } = storyboardStoryFixture();
    expect(() => parseStory({ storySpec: 1, version: 2, ...body })).toThrow(/must agree/);
  });

  it('storyToJSON always includes document.version (spec)', () => {
    const json = storyToJSON(storyboardStoryFixture()) as { document: { version: number } };
    expect(json.document.version).toBe(1);
  });

  it('round-trips through JSON', () => {
    const story = storyboardStoryFixture();
    expect(storyFromJSON(storyToJSON(story))).toEqual(story);
  });
});