import { generateEpisodeCalendar } from '../calendar/generate-episode-calendar.js';
import { validateJourneyBindings } from '../journey/validate-journey-bindings.js';
import { touchpointIndexFromCatalog } from '../touchpoint/touchpoint-catalog.js';
import { validateStoryNarrativeAssociations } from './validate-story-associations.js';
import { validateStoryNarrativeScenes } from './validate-story-scenes.js';
import type { EpisodeActivityCalendar } from '../types/episode-activity.js';
import type { PlaceMount } from '../types/place-mount.js';
import type { StoryCharacterContext } from '../types/story-character-context.js';
import type { Story } from '../types/story-narrative.js';
import type { StoryTouchpointCatalog } from '../types/touchpoint-catalog.js';
import type { TouchpointIndex } from '../types/touchpoint-index.js';
import type { Journey } from '@local-hosting/twinfile-character/persona';

export type CompileStoryInput = {
  story: Story;
  /** Character journey for `binding.journeyId` association checks (optional). */
  journey?: Journey;
  touchpointCatalog?: StoryTouchpointCatalog;
  touchpointIndex?: TouchpointIndex;
  journeyPace?: string;
  characterContext?: StoryCharacterContext;
  placeMounts?: readonly PlaceMount[];
  /** Persona subject id — when set, compile stores doppler-shaped activity calendar on result metadata. */
  subjectId?: string;
  random?: () => number;
  knownCharacterIds?: readonly string[];
  knownPlaceRefs?: readonly string[];
};

export type CompileStoryResult =
  | { ok: true; story: Story; activityCalendar?: EpisodeActivityCalendar }
  | { ok: false; issues: string[] };

function resolveCompileTouchpointIndex(input: CompileStoryInput): TouchpointIndex | undefined {
  if (input.touchpointCatalog) {
    return touchpointIndexFromCatalog(input.touchpointCatalog);
  }
  return input.touchpointIndex;
}

/** Materialize `episodeArc` from storyboard `scenes` when absent or when `force` is set. */
export function compileStory(
  input: CompileStoryInput & { force?: boolean },
): CompileStoryResult {
  const sceneCheck = validateStoryNarrativeScenes(input.story);
  if (!sceneCheck.ok) {
    return sceneCheck;
  }

  const touchpointIndex = resolveCompileTouchpointIndex(input);
  const journeyId = input.story.binding.journeyId;

  if (input.journey) {
    const bindingCheck = validateJourneyBindings(input.journey, touchpointIndex);
    if (!bindingCheck.ok) {
      return bindingCheck;
    }
  }

  const associationCheck = validateStoryNarrativeAssociations(input.story, {
    journey: input.journey,
    knownCharacterIds: input.knownCharacterIds,
    knownPlaceRefs: input.knownPlaceRefs,
  });
  if (!associationCheck.ok) {
    return associationCheck;
  }

  if (input.journey && input.journey.id !== journeyId) {
    return {
      ok: false,
      issues: [
        `story.binding.journeyId (${journeyId}) does not match journey.id (${input.journey.id})`,
      ],
    };
  }

  if (input.story.episodeArc && !input.force) {
    return { ok: true, story: input.story };
  }

  const calendarBase = {
    simulationEpochStart: input.story.binding.simulationEpochStart,
    planningHorizonDays: input.story.binding.planningHorizonDays,
    visitDayIndex: input.story.binding.visitDayIndex,
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
    scenes: input.story.scenes,
    ...calendarBase,
  });

  return {
    ok: true,
    story: {
      ...input.story,
      episodeArc: calendar.episodeArc,
    },
    ...(calendar.activityCalendar ? { activityCalendar: calendar.activityCalendar } : {}),
  };
}
