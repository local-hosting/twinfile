import type { EpisodeArcV1 } from './episode-arc.js';
import type { EpisodeTimingVariation } from './episode-timing-variation.js';
import type { StoryScene } from './scene.js';
import type { StoryArcTemplate } from './story-arc-template.js';
import type { StoryCharacterRef, StoryPlaceRef } from './story-refs.js';

/** Document header (`story.yml`). */
export type StoryDocument = {
  /** SAMSpec contract version (alias on disk: `storySpec`). */
  version: 1;
  id: string;
  title: string;
  revision: number;
  summary?: string;
};

/** Links focal character, journey, and simulation clock for this run. */
export type StoryBinding = {
  /** Focal Character id — must match journey.personaId when `journeyId` is set. */
  characterId: string;
  /** Character/AXM journey id — links phase/obstacle spine; scenes are the narrative authority. */
  journeyId: string;
  simulationEpochStart: string;
  planningHorizonDays?: number;
  visitDayIndex?: number;
  /** Overrides {@link DEFAULT_EPISODE_TIMING_VARIATION} for visit-day / horizon sampling on this episode. */
  timingVariation?: Partial<EpisodeTimingVariation>;
};

/**
 * Story Arc Model — one portable episode plan for a project story run.
 * Journey definitions stay on Character/AXM; Story holds cast/place associations and the materialized arc.
 */
export type Story = StoryDocument & {
  /** Characters in this story (≥1). When omitted on disk, defaults from `binding.characterId`. */
  characters: StoryCharacterRef[];
  /** Place mounts referenced by scenes (`placeRef` on each frame). */
  places: StoryPlaceRef[];
  /** Write Practice arc (`kind` + dramatic beats). */
  arcTemplate: StoryArcTemplate;
  /** Storyboard scenes — cast + place per frame. */
  scenes: StoryScene[];
  binding: StoryBinding;
  /** Filled by {@link compileStory} when not authored on disk. */
  episodeArc?: EpisodeArcV1;
};
