import { describe, expect, it } from 'vitest';
import { buildStoryPlanExtractionIndex } from '../../../../../src/contract/narrative/story-plan/plan-corpus.js';
import { enrichStoryPlanExtractionIndexFromProjectTwins } from '../../../../../src/contract/narrative/story-plan/enrich-story-plan-extraction-index-from-twins.js';
import type { Character } from '@local-hosting/twinfile/character';
import type { JobContextModel } from '@local-hosting/twinfile/context';

const commuteContext: JobContextModel = {
  id: 'context:commute',
  label: 'Weekday commute',
  context: 'When I am getting ready for work',
  jobs: [
    {
      id: 'job:commute',
      text: 'Commute',
      context: 'weekday morning',
      goal: 'get to work',
      outcome: 'start shift',
    },
    {
      id: 'job:detour',
      text: 'Detour',
      context: 'bad weather',
      goal: 'stay dry',
      outcome: 'arrive safely',
    },
  ],
};

const rider: Character = {
  version: 1,
  id: 'persona:rider',
  title: 'Rider',
  revision: 1,
  persona: {
    id: 'persona:rider',
    label: 'Urban Rider',
    quote: 'Get me there on time',
    segment: 'commuter',
    goals: ['Arrive on time'],
    frustrations: [],
    jobIds: ['job:commute'],
  },
};

describe('enrichStoryPlanExtractionIndexFromProjectTwins', () => {
  it('adds Context twins and ranked jobs per project character', () => {
    const base = buildStoryPlanExtractionIndex({
      segments: [],
      engagementLevelIds: [],
      intentIds: [],
      focusAreaIds: [],
      journeyIds: [],
      characterIds: ['persona:rider'],
      storyIds: ['story:rider'],
      jobIds: [],
      fleetPlaces: [],
      touchpointCount: 0,
      touchpointIdsSample: [],
      storyMenu: {
        characters: [{ characterId: 'persona:rider', label: 'Rider', journeyIds: ['journey:commute'] }],
        stories: [
          {
            id: 'story:rider',
            title: 'Commute',
            focalCharacterId: 'persona:rider',
          },
        ],
      },
    });

    const enriched = enrichStoryPlanExtractionIndexFromProjectTwins(base, {
      characters: [rider],
      contexts: [commuteContext],
      rankedJobLimit: 4,
    });

    expect(enriched.contexts?.[0]).toMatchObject({
      contextId: 'context:commute',
      label: 'Weekday commute',
    });
    expect(enriched.contexts?.[0]?.jobIds).toContain('job:commute');
    expect(enriched.characterContexts?.[0]).toMatchObject({
      characterId: 'persona:rider',
      contextId: 'context:commute',
    });
    expect(enriched.characterContexts?.[0]?.rankedJobIds.length).toBeGreaterThan(0);
    expect(enriched.jobIds).toContain('job:commute');
  });
});
