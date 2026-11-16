import { obstacleCatalogFromJobs } from '@doppler-group/twinfile-context';
import {
  resolvePlanningSegmentJourneyPace,
  segmentIdFromPersonaSegment,
  type Character,
} from '@doppler-group/twinfile-character/persona';

import type {
  StoryJourneyRefV1,
  StoryPlanningCatalogsFromCharactersV1,
} from '../types/story-planning-catalog-slices.js';

function storyJourneyRefsFromCharacters(characters: readonly Character[]): StoryJourneyRefV1[] {
  const seen = new Set<string>();
  const refs: StoryJourneyRefV1[] = [];
  for (const character of characters) {
    for (const journey of character.journeys ?? []) {
      if (seen.has(journey.id)) continue;
      seen.add(journey.id);
      refs.push({ id: journey.id, label: journey.label });
    }
  }
  return refs;
}

/** Character twin documents → story.create / plan catalog slices. */
export function buildStoryPlanningCatalogsFromCharacters(
  characters: readonly Character[],
): StoryPlanningCatalogsFromCharactersV1 {
  const personas = characters.map((row) => row.persona).filter(Boolean);
  const jobs = characters.flatMap((row) => row.jobs ?? []);
  const obstacleCatalog = obstacleCatalogFromJobs(jobs);

  const segmentIds = [
    ...new Set(
      personas
        .map((persona) => segmentIdFromPersonaSegment(persona.segment))
        .filter((id) => id.length > 0),
    ),
  ];

  const segments = segmentIds.map((id) => {
    const persona = personas.find((row) => segmentIdFromPersonaSegment(row.segment) === id);
    return {
      id,
      overview: {
        name: persona?.label ?? id,
        mindset: persona?.mindset ?? persona?.who ?? '',
        journeyPace:
          resolvePlanningSegmentJourneyPace(
            persona as { journeyPace?: string; overview?: { journeyPace?: string } },
          ) ?? 'medium',
      },
    };
  });

  const jtbdJobs = jobs.map((job) => ({
    id: job.id,
    label: job.goal || job.text,
    /** Situation. */
    context: job.context,
    /** Job / progress. */
    goal: job.goal,
    /** Definition of success. */
    outcome: job.outcome,
    needId: job.id,
  }));

  const storyPlanningGuide =
    personas.length > 0
      ? personas
          .map((persona) => {
            const name = persona.label?.trim() || persona.id;
            const mindset = persona.mindset?.trim() || persona.who?.trim();
            return mindset ? `${name}: ${mindset}` : name;
          })
          .filter(Boolean)
          .join('\n')
      : undefined;

  const personaCatalog = {
    specVersion: '1.0' as const,
    personas: personas.map((persona) => ({
      id: persona.id,
      label: persona.label,
      name: persona.exemplar?.name ?? persona.label,
      quote: persona.quote,
      painPoints: persona.frustrations ?? [],
      segmentAffinities: [
        {
          segmentId: segmentIdFromPersonaSegment(persona.segment),
          weight: 'share' in persona && typeof persona.share === 'number' ? persona.share : 1,
        },
      ],
      priorityJobIds: [...(persona.jobIds ?? [])].filter((id) => id.trim().length > 0),
    })),
  };

  return {
    storyJourneyRefs: storyJourneyRefsFromCharacters(characters),
    ...(storyPlanningGuide ? { storyPlanningGuide } : {}),
    segmentCatalog: {
      specVersion: '1.0',
      segments,
    },
    jtbdCatalog: {
      specVersion: '1.0',
      jobs: jtbdJobs,
    },
    obstacleCatalog: {
      specVersion: '1.0',
      obstacles: obstacleCatalog.obstacles.map((row) => ({
        id: row.id,
        label: row.label,
        jobId: row.jobId,
        removable: row.removable,
      })),
    },
    personaCatalog,
    customerCatalog: {
      specVersion: '1.0',
      engagementLevels: [
        { id: 'explorer', label: 'Explorer', validIntentIds: [] },
        { id: 'regular', label: 'Regular', validIntentIds: [] },
      ],
      intents: jtbdJobs.map((job) => ({ id: job.id, label: job.label, opportunityId: 'prospect' })),
      focusAreas: [],
      opportunities: [],
    },
  };
}

export function listStoryJourneyRefsFromPlanningCatalogs(
  catalogs: Pick<StoryPlanningCatalogsFromCharactersV1, 'storyJourneyRefs'>,
): StoryJourneyRefV1[] {
  return catalogs.storyJourneyRefs ?? [];
}