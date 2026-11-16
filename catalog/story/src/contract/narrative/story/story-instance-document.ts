import {
  defaultStoryClockCursor,
  storyClockCursorFromWire,
  storyClockCursorToWire,
  type StoryClockCursor,
  type StoryClockCursorWire,
} from '../clock/story-clock-cursor.js';
import type { Story } from '../types/story-narrative.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { StoryTimelineHostWire } from './timeline-host-wire.js';

/** Clock and calendar for one story instance. The Story template is kept separately. */
export type StoryCharacteristics = {
  clock: StoryClockCursorWire;
  timeline: StoryTimelineHostWire;
};

/** @deprecated Use {@link StoryCharacteristics}. The JSON is the expansion, not the Story template. */
export type StoryInstanceJson = StoryCharacteristics;

export type StoryRuntimeWire = StoryCharacteristics;

const SAM_TEMPLATE_KEYS = ['episodeArc', 'scenes', 'binding', 'arcTemplate', 'characters', 'places'] as const;

function isClock(value: unknown): value is StoryClockCursorWire {
  if (!value || typeof value !== 'object') return false;
  const row = value as StoryClockCursorWire;
  return typeof row.dayIndex === 'number' && typeof row.hourOfDay === 'number';
}

function isTimeline(value: unknown): value is StoryTimelineHostWire {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Story expansion JSON. Rejects a copied Story template. */
export function storyCharacteristicsFromJSON(json: unknown): StoryCharacteristics {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('Story characteristics must be an object');
  }
  const row = json as Record<string, unknown>;
  for (const key of SAM_TEMPLATE_KEYS) {
    if (key in row) {
      throw new Error(
        'Story characteristics cannot include the Story template. Compose the story from the Story plus clock and timeline.',
      );
    }
  }
  if (!isClock(row.clock) || !isTimeline(row.timeline)) {
    throw new Error('Story characteristics require clock and timeline');
  }
  return { clock: row.clock, timeline: row.timeline };
}

/** Story object: Story template plus the story expansion (clock + timeline). */
export class StoryInstanceDocument {
  readonly #story: Story;
  #characteristics: StoryCharacteristics;

  private constructor(story: Story, characteristics: StoryCharacteristics) {
    this.#story = story;
    this.#characteristics = characteristics;
  }

  static compose(story: Story, characteristics: StoryCharacteristics): StoryInstanceDocument {
    if (!story.episodeArc) {
      throw new Error('StoryInstanceDocument requires episodeArc on the Story template');
    }
    return new StoryInstanceDocument(story, characteristics);
  }

  static fromCompiled(
    story: Story,
    input: { timeline: StoryTimelineHostWire; startHour?: number },
  ): StoryInstanceDocument {
    return StoryInstanceDocument.compose(story, {
      clock: storyClockCursorToWire(defaultStoryClockCursor(input.startHour ?? 9)),
      timeline: input.timeline,
    });
  }

  get story(): Story {
    return this.#story;
  }

  get episodeArc(): EpisodeArcV1 | undefined {
    return this.#story.episodeArc;
  }

  get characteristics(): StoryCharacteristics {
    return this.#characteristics;
  }

  /** @deprecated Use {@link characteristics}. */
  get runtime(): StoryCharacteristics {
    return this.#characteristics;
  }

  clockCursor(): StoryClockCursor {
    return storyClockCursorFromWire(this.#characteristics.clock);
  }

  setClock(cursor: StoryClockCursor): void {
    this.#characteristics = {
      ...this.#characteristics,
      clock: storyClockCursorToWire(cursor),
    };
  }

  /** Story expansion JSON. Does not include the Story template. */
  toJSON(): StoryCharacteristics {
    return JSON.parse(JSON.stringify(this.#characteristics)) as StoryCharacteristics;
  }
}
