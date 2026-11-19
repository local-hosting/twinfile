import type { BuiltTwinHead } from '@local-hosting/twinfile';
import { createHeadTwinTypeModule, isRecord } from '@local-hosting/twinfile';

export const kind = 'story' as const;

export type StoryBuilt = BuiltTwinHead;

/** `story.beats` → `story.scenes` (one release). */
export function normalizeStoryHead(doc: Record<string, unknown>): Record<string, unknown> {
  const story = doc.story;
  if (!isRecord(story)) return doc;
  if (Array.isArray(story.scenes)) return doc;
  const beats = story.beats;
  if (!Array.isArray(beats)) return doc;
  const { beats: _removed, ...rest } = story;
  return {
    ...doc,
    story: { ...rest, scenes: beats },
  };
}

export const module = createHeadTwinTypeModule({ kind, normalize: normalizeStoryHead });
