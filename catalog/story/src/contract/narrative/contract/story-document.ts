import {
  exportTwinfileToLoroMap,
  importTwinfileFromLoroMap,
  type TwinfileLoroMap,
} from '@doppler-group/twinfile-core/loro';

import type { Story } from '../types/story-narrative.js';
import { storyFromJSON, storyToJSON, type StoryJson } from './json.js';

/** Object-oriented Story document with JSON and host LoroMap round-trip. */
export class StoryDocument {
  readonly #story: Story;

  private constructor(story: Story) {
    this.#story = story;
  }

  static from(story: Story): StoryDocument {
    return new StoryDocument(story);
  }

  static fromJSON(json: unknown): StoryDocument {
    return new StoryDocument(storyFromJSON(json));
  }

  /** Re-instantiate from a host-passed PackMap / LoroMap-like object. */
  static import(map: TwinfileLoroMap): StoryDocument {
    return StoryDocument.fromJSON(importTwinfileFromLoroMap(map));
  }

  get value(): Story {
    return this.#story;
  }

  toJSON(): StoryJson & Record<string, unknown> {
    return storyToJSON(this.#story) as StoryJson & Record<string, unknown>;
  }

  /** Write this story onto a host-passed PackMap / LoroMap-like object. */
  export(map: TwinfileLoroMap): void {
    exportTwinfileToLoroMap(map, this.toJSON());
  }
}
