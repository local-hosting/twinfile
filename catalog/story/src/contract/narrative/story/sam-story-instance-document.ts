import {
  defaultStoryClockCursor,
  storyClockCursorFromWire,
  storyClockCursorToWire,
  type StoryClockCursor,
  type StoryClockCursorWire,
} from '../clock/story-clock-cursor.js';
import type { SAM } from '../types/sam.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { StoryTimelineHostWire } from './timeline-host-wire.js';

/** Clock and calendar for one story instance. The SAM template is kept separately. */
export type StoryCharacteristics = {
  clock: StoryClockCursorWire;
  timeline: StoryTimelineHostWire;
};

/** @deprecated Use {@link StoryCharacteristics}. The JSON is the expansion, not the SAM template. */
export type SamStoryInstanceJson = StoryCharacteristics;

export type SamStoryRuntimeWire = StoryCharacteristics;

const SAM_TEMPLATE_KEYS = ['episodeArc', 'scenes', 'binding', 'arcTemplate', 'characters', 'places'] as const;

function isClock(value: unknown): value is StoryClockCursorWire {
  if (!value || typeof value !== 'object') return false;
  const row = value as StoryClockCursorWire;
  return typeof row.dayIndex === 'number' && typeof row.hourOfDay === 'number';
}

function isTimeline(value: unknown): value is StoryTimelineHostWire {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Story expansion JSON. Rejects a copied SAM template. */
export function storyCharacteristicsFromJSON(json: unknown): StoryCharacteristics {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('Story characteristics must be an object');
  }
  const row = json as Record<string, unknown>;
  for (const key of SAM_TEMPLATE_KEYS) {
    if (key in row) {
      throw new Error(
        'Story characteristics cannot include the SAM template. Compose the story from the SAM plus clock and timeline.',
      );
    }
  }
  if (!isClock(row.clock) || !isTimeline(row.timeline)) {
    throw new Error('Story characteristics require clock and timeline');
  }
  return { clock: row.clock, timeline: row.timeline };
}

/** Story object: SAM template plus the story expansion (clock + timeline). */
export class SamStoryInstanceDocument {
  readonly #sam: SAM;
  #characteristics: StoryCharacteristics;

  private constructor(sam: SAM, characteristics: StoryCharacteristics) {
    this.#sam = sam;
    this.#characteristics = characteristics;
  }

  static compose(sam: SAM, characteristics: StoryCharacteristics): SamStoryInstanceDocument {
    if (!sam.episodeArc) {
      throw new Error('SamStoryInstanceDocument requires episodeArc on the SAM template');
    }
    return new SamStoryInstanceDocument(sam, characteristics);
  }

  static fromCompiled(
    sam: SAM,
    input: { timeline: StoryTimelineHostWire; startHour?: number },
  ): SamStoryInstanceDocument {
    return SamStoryInstanceDocument.compose(sam, {
      clock: storyClockCursorToWire(defaultStoryClockCursor(input.startHour ?? 9)),
      timeline: input.timeline,
    });
  }

  get sam(): SAM {
    return this.#sam;
  }

  get episodeArc(): EpisodeArcV1 | undefined {
    return this.#sam.episodeArc;
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

  /** Story expansion JSON. Does not include the SAM template. */
  toJSON(): StoryCharacteristics {
    return JSON.parse(JSON.stringify(this.#characteristics)) as StoryCharacteristics;
  }
}
