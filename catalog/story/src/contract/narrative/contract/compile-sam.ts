import { generateEpisodeCalendar } from '../calendar/generate-episode-calendar.js';
import { validateJourneyBindings } from '../journey/validate-journey-bindings.js';
import { touchpointIndexFromCatalog } from '../touchpoint/touchpoint-catalog.js';
import { validateSAMAssociations } from './validate-sam-associations.js';
import { validateSAMScenes } from './validate-sam-scenes.js';
import type { EpisodeActivityCalendar } from '../types/episode-activity.js';
import type { PlaceMount } from '../types/place-mount.js';
import type { SAMCharacterContext } from '../types/sam-character-context.js';
import type { SAM } from '../types/sam.js';
import type { SAMTouchpointCatalog } from '../types/touchpoint-catalog.js';
import type { TouchpointIndex } from '../types/touchpoint-index.js';
import type { Journey } from '@local-hosting/twinfile-character/pcm';

export type CompileSAMInput = {
  sam: SAM;
  /** PCM journey for `binding.journeyId` association checks (optional). */
  journey?: Journey;
  touchpointCatalog?: SAMTouchpointCatalog;
  touchpointIndex?: TouchpointIndex;
  journeyPace?: string;
  characterContext?: SAMCharacterContext;
  placeMounts?: readonly PlaceMount[];
  /** Persona subject id — when set, compile stores doppler-shaped activity calendar on result metadata. */
  subjectId?: string;
  random?: () => number;
  knownPcmIds?: readonly string[];
  knownVenueKeys?: readonly string[];
};

export type CompileSAMResult =
  | { ok: true; sam: SAM; activityCalendar?: EpisodeActivityCalendar }
  | { ok: false; issues: string[] };

function resolveCompileTouchpointIndex(input: CompileSAMInput): TouchpointIndex | undefined {
  if (input.touchpointCatalog) {
    return touchpointIndexFromCatalog(input.touchpointCatalog);
  }
  return input.touchpointIndex;
}

/** Materialize `episodeArc` from storyboard `scenes` when absent or when `force` is set. */
export function compileSAM(
  input: CompileSAMInput & { force?: boolean },
): CompileSAMResult {
  const sceneCheck = validateSAMScenes(input.sam);
  if (!sceneCheck.ok) {
    return sceneCheck;
  }

  const touchpointIndex = resolveCompileTouchpointIndex(input);
  const journeyId = input.sam.binding.journeyId;

  if (input.journey) {
    const bindingCheck = validateJourneyBindings(input.journey, touchpointIndex);
    if (!bindingCheck.ok) {
      return bindingCheck;
    }
  }

  const associationCheck = validateSAMAssociations(input.sam, {
    journey: input.journey,
    knownPcmIds: input.knownPcmIds,
    knownVenueKeys: input.knownVenueKeys,
  });
  if (!associationCheck.ok) {
    return associationCheck;
  }

  if (input.journey && input.journey.id !== journeyId) {
    return {
      ok: false,
      issues: [
        `sam.binding.journeyId (${journeyId}) does not match journey.id (${input.journey.id})`,
      ],
    };
  }

  if (input.sam.episodeArc && !input.force) {
    return { ok: true, sam: input.sam };
  }

  const calendarBase = {
    simulationEpochStart: input.sam.binding.simulationEpochStart,
    planningHorizonDays: input.sam.binding.planningHorizonDays,
    visitDayIndex: input.sam.binding.visitDayIndex,
    journeyPace: input.journeyPace,
    characterContext: input.characterContext,
    placeMounts: input.placeMounts,
    touchpointCatalog: input.touchpointCatalog,
    touchpointIndex,
    subjectId: input.subjectId,
    random: input.random,
  };

  const calendar = generateEpisodeCalendar({
    source: 'scenes',
    scenes: input.sam.scenes,
    ...calendarBase,
  });

  return {
    ok: true,
    sam: {
      ...input.sam,
      episodeArc: calendar.episodeArc,
    },
    ...(calendar.activityCalendar ? { activityCalendar: calendar.activityCalendar } : {}),
  };
}
