import type { EpisodeArcV1 } from './episode-arc.js';
import type { EpisodeTimingVariation } from './episode-timing-variation.js';
import type { StoryScene } from './scene.js';
import type { StoryArcTemplate } from './story-arc-template.js';
import type { SAMCharacterRef, SAMPlaceRef } from './sam-refs.js';

/** Document header (`sam.yml`). */
export type SAMDocument = {
  /** SAMSpec contract version (alias on disk: `samSpec`). */
  version: 1;
  id: string;
  title: string;
  revision: number;
  summary?: string;
};

/** Links focal character, journey, and simulation clock for this run. */
export type SAMBinding = {
  /** Focal PCM id — must match journey.personaId when `journeyId` is set. */
  pcmId: string;
  /** PCM/AXM journey id — links phase/obstacle spine; scenes are the narrative authority. */
  journeyId: string;
  simulationEpochStart: string;
  planningHorizonDays?: number;
  visitDayIndex?: number;
  /** Overrides {@link DEFAULT_EPISODE_TIMING_VARIATION} for visit-day / horizon sampling on this episode. */
  timingVariation?: Partial<EpisodeTimingVariation>;
};

/**
 * Story Arc Model — one portable episode plan for a project story run.
 * Journey definitions stay on PCM/AXM; SAM holds cast/place associations and the materialized arc.
 */
export type SAM = SAMDocument & {
  /** PCMs in this story (≥1). When omitted on disk, defaults from `binding.pcmId`. */
  characters: SAMCharacterRef[];
  /** Place mounts referenced by scenes (`placeRef` on each frame). */
  places: SAMPlaceRef[];
  /** Write Practice arc (`kind` + dramatic beats). */
  arcTemplate: StoryArcTemplate;
  /** Storyboard scenes — cast + place per frame. */
  scenes: StoryScene[];
  binding: SAMBinding;
  /** Filled by {@link compileSAM} when not authored on disk. */
  episodeArc?: EpisodeArcV1;
};
