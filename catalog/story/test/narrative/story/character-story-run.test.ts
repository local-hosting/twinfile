import { CharacterStoryInstanceDocument } from '@local-hosting/twinfile-character/character';
import { describe, expect, it } from 'vitest';
import type { EpisodeArcV1 } from '../../../src/contract/narrative/types/episode-arc.js';
import type { Story } from '../../../src/contract/narrative/types/story-narrative.js';
import { advanceStoryEpisode } from '../../../src/contract/narrative/story/advance-story-episode.js';
import { buildCharacterStoryRun } from '../../../src/contract/narrative/story/character-story-run.js';
import { resolveStoryNarrativeInstance } from '../../../src/contract/narrative/story/resolve-story-narrative-instance.js';

const sessionArc: EpisodeArcV1 = {
  version: 1,
  simulationEpochStart: '2026-01-06',
  planningHorizonDays: 1,
  visitDayIndex: 0,
  objectiveTouchpointIds: ['touchpoint:rider-open-home', 'touchpoint:rider-live-map'],
  phases: {
    pre_visit: { startDayIndex: 0, endDayIndex: 0 },
    on_site: { dayIndex: 0 },
    post_visit: { startDayIndex: 0, endDayIndex: 0 },
  },
  touchpointSchedule: [],
};

const samWithArc: Story = {
  version: 1,
  id: 'story:episode:rider-commute',
  title: 'Commute',
  revision: 1,
  characters: [{ characterId: 'persona:rider', primary: true }],
  places: [{ placeRef: 'twinfile/place/demo-home:0.0.0' }],
  arcTemplate: {
    id: 'arc:commute',
    label: 'Commute',
    kind: 'man_in_a_hole',
    acts: [
      { id: 'exposition', label: 'Plan', order: 0 },
      { id: 'denouement', label: 'Arrive', order: 1 },
    ],
  },
  scenes: [
    {
      id: 'scene:plan',
      label: 'Plan',
      order: 0,
      actId: 'exposition',
      characterIds: ['persona:rider'],
      placeRef: 'twinfile/place/demo-home:0.0.0',
      touchpointIds: ['touchpoint:rider-open-home'],
    },
    {
      id: 'scene:ride',
      label: 'Ride',
      order: 1,
      actId: 'denouement',
      characterIds: ['persona:rider'],
      placeRef: 'twinfile/place/demo-home:0.0.0',
      touchpointIds: ['touchpoint:rider-live-map'],
    },
  ],
  binding: {
    characterId: 'persona:rider',
    journeyId: 'journey:rider-commute',
    simulationEpochStart: sessionArc.simulationEpochStart,
    planningHorizonDays: sessionArc.planningHorizonDays,
    visitDayIndex: sessionArc.visitDayIndex,
  },
  episodeArc: sessionArc,
};

const pcmBody = {
  specVersion: '1.0' as const,
  characterId: 'persona:rider',
  segmentId: 'urban-commuter',
  displayName: 'Maya Chen',
  instanceId: 'rider-urban-commuter-3',
  characteristics: { traits: ['Time-sensitive'] },
  createdAt: '2026-01-01T00:00:00.000Z',
};

const instance = CharacterStoryInstanceDocument.fromJSON(pcmBody).value;

const savedCharacteristics = {
  clock: { dayIndex: 0, hourOfDay: 9 },
  timeline: { '2026-01-06': { dayIndex: 0, schedule: { activities: [] } } },
};

describe('resolveStoryNarrativeInstance', () => {
  it('composes saved clock and timeline', () => {
    const { document, synthesized } = resolveStoryNarrativeInstance({
      story: samWithArc,
      characteristics: savedCharacteristics,
    });
    expect(synthesized).toBe(false);
    expect(document.characteristics.clock).toEqual(savedCharacteristics.clock);
  });

  it('synthesizes clock and timeline from episodeArc when none are saved', () => {
    const { document, synthesized } = resolveStoryNarrativeInstance({
      story: samWithArc,
      subjectId: 'rider-urban-commuter-3',
    });
    expect(synthesized).toBe(true);
    expect(document.characteristics.timeline).toBeDefined();
  });
});

describe('buildCharacterStoryRun', () => {
  const story = resolveStoryNarrativeInstance({
    story: samWithArc,
    characteristics: savedCharacteristics,
  }).document;

  it('matches characterId to characterId when instanceId differs', () => {
    const run = buildCharacterStoryRun({ characterId: 'persona:rider', instance, story });
    expect(run?.characterId).toBe('persona:rider');
    expect(run?.instance.instanceId).toBe('rider-urban-commuter-3');
    expect(run?.beat).toBeDefined();
    expect(run?.psychology).toBeDefined();
  });

  it('returns undefined when characterId does not match the instance', () => {
    expect(buildCharacterStoryRun({ characterId: 'persona:driver', instance, story })).toBe(undefined);
  });
});

describe('advanceStoryEpisode', () => {
  it('returns updated characteristics without mutating the story', () => {
    const story = resolveStoryNarrativeInstance({
      story: samWithArc,
      characteristics: savedCharacteristics,
    }).document;

    const result = advanceStoryEpisode({
      characterId: 'persona:rider',
      story,
      instance,
      target: 'visit_day',
      hourOfDay: 14,
    });

    expect(result.characteristics.clock.hourOfDay).toBe(14);
    expect(result.characteristics.timeline).toEqual(savedCharacteristics.timeline);
    expect(story.characteristics.clock).toEqual(savedCharacteristics.clock);
  });
});
