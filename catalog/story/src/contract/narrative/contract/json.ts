import { omitNullishDeep } from './omit-nullish-deep.js';
import { parseStory } from '../schemas/story-narrative.schema.js';
import type { Story } from '../types/story-narrative.js';

export type StoryJson = {
  document: Record<string, unknown>;
  characters: unknown[];
  places?: unknown[];
  arcTemplate?: Record<string, unknown>;
  scenes?: unknown[];
  binding: Record<string, unknown>;
  episodeArc?: Record<string, unknown>;
};

/** JSON export of a Story document. */
export function storyToJSON(story: Story): Record<string, unknown> {
  const {
    id,
    title,
    revision,
    version,
    summary,
    characters,
    places,
    arcTemplate,
    scenes,
    binding,
    episodeArc,
  } = story;

  const document: Record<string, unknown> = { version, id, title, revision };
  if (summary !== undefined) document.summary = summary;

  return omitNullishDeep({
    document,
    characters,
    ...(places?.length ? { places } : {}),
    ...(arcTemplate ? { arcTemplate } : {}),
    ...(scenes?.length ? { scenes } : {}),
    binding,
    ...(episodeArc ? { episodeArc } : {}),
  });
}

export function storyFromJSON(json: unknown): Story {
  const raw = json as StoryJson & Record<string, unknown>;
  const doc = raw.document ?? {};

  return parseStory({
    ...doc,
    characters: raw.characters,
    places: raw.places,
    arcTemplate: (raw as StoryJson).arcTemplate,
    scenes: raw.scenes,
    binding: raw.binding,
    episodeArc: raw.episodeArc,
  });
}
