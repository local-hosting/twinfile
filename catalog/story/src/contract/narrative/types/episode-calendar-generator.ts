import type { PlaceMount } from './place-mount.js';
import type { EpisodeActivityCalendar } from './episode-activity.js';
import type { EpisodeArcV1, EpisodeTouchpointScheduleEntry } from './episode-arc.js';
import type { StoryCharacterContext } from './story-character-context.js';
import type { StoryScene } from './scene.js';
import type { StoryTouchpointCatalog } from './touchpoint-catalog.js';
import type { TouchpointIndex } from './touchpoint-index.js';

/** Touchpoint metadata for phase classification and activity labels (from org graph or Story mount). */
export type EpisodeCalendarResources = {
  touchpointCatalog?: StoryTouchpointCatalog;
  /** Legacy minimal index — ignored when `touchpointCatalog` is set. */
  touchpointIndex?: TouchpointIndex;
  /** Resolved place mounts — used for per-scene space defaults (`scene.placeRef` = `placeRef`). */
  placeMounts?: readonly PlaceMount[];
  /** Character mounts — hydrates scene spine fields during {@link compileStory}. */
  characterContext?: StoryCharacterContext;
};

/** Simulation clock and visit placement for a compiled episode. */
export type EpisodeCalendarClock = {
  /** Wall-aligned simulation epoch (day 0) — ISO `YYYY-MM-DD`. */
  simulationEpochStart: string;
  planningHorizonDays?: number;
  /** Day index of the focal visit within `[0, planningHorizonDays - 1]`. */
  visitDayIndex?: number;
  journeyPace?: string;
  random?: () => number;
  /** When set, also emit {@link GenerateEpisodeCalendarResult.activityCalendar}. */
  subjectId?: string;
};

export type GenerateEpisodeCalendarFromSequence = EpisodeCalendarClock &
  EpisodeCalendarResources & {
    source: 'sequence';
    touchpointSequence: readonly string[];
  };

export type GenerateEpisodeCalendarFromScenes = EpisodeCalendarClock &
  EpisodeCalendarResources & {
    source: 'scenes';
    scenes: readonly StoryScene[];
  };

/** Low-level calendar builder — prefer {@link compileStory} for authored episodes. */
export type GenerateEpisodeCalendarInput =
  | GenerateEpisodeCalendarFromSequence
  | GenerateEpisodeCalendarFromScenes;

export type GenerateEpisodeCalendarResult = {
  episodeArc: EpisodeArcV1;
  touchpointSequence: readonly string[];
  /** Present when `subjectId` was provided on input. */
  activityCalendar?: EpisodeActivityCalendar;
};

export type EpisodeCalendarScheduledTouchpoint = EpisodeTouchpointScheduleEntry & {
  isoDate: string;
};

/** Horizon days keyed by ISO date with touchpoint schedule rows for that day. */
export type EpisodeCalendarByIsoDate = Readonly<
  Record<string, readonly EpisodeCalendarScheduledTouchpoint[]>
>;

export type BuildEpisodeCalendarDaysInput = {
  episodeArc: EpisodeArcV1;
  /** When true, include every horizon day (empty arrays on quiet days). Default: scheduled days only. */
  includeEmptyDays?: boolean;
};

export type EpisodeCalendarDays = {
  simulationEpochStart: string;
  planningHorizonDays: number;
  byIsoDate: EpisodeCalendarByIsoDate;
};
