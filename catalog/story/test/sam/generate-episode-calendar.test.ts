import { describe, expect, it } from 'vitest';

import {
  buildEpisodeCalendarDays,
  generateEpisodeCalendar,
} from '../../src/contract/narrative/calendar/generate-episode-calendar.js';
import { simulationDateIso } from '../../src/contract/narrative/calendar/simulation-date.js';
import { touchpointCatalogFromWire } from '../../src/contract/narrative/touchpoint/touchpoint-catalog.js';
import { storyboardSamFixture } from './helpers/storyboard-sam-fixture.js';

const commuteScenes = storyboardSamFixture({
  scenes: [
    {
      id: 'scene:plan',
      label: 'Plan',
      order: 0,
      actId: 'exposition',
      characterIds: ['persona:rider'],
      venueKey: 'venue:curbside',
      touchpointIds: ['touchpoint:pre'],
    },
    {
      id: 'scene:ride',
      label: 'Ride',
      order: 1,
      actId: 'denouement',
      characterIds: ['persona:rider'],
      venueKey: 'venue:curbside',
      touchpointIds: ['touchpoint:on'],
    },
  ],
}).scenes;

describe('generateEpisodeCalendar', () => {
  it('compiles from storyboard scenes', () => {
    const result = generateEpisodeCalendar({
      source: 'scenes',
      scenes: commuteScenes,
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 10,
      planningHorizonDays: 42,
    });
    expect(result.touchpointSequence).toEqual(['touchpoint:pre', 'touchpoint:on']);
    expect(result.episodeArc.visitDayIndex).toBe(10);
    expect(result.episodeArc.touchpointSchedule.length).toBeGreaterThan(0);
  });

  it('compiles from explicit sequence', () => {
    const result = generateEpisodeCalendar({
      source: 'sequence',
      touchpointSequence: ['tp:1', 'tp:2'],
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 5,
      planningHorizonDays: 42,
    });
    expect(result.episodeArc.objectiveTouchpointIds).toEqual(['tp:1', 'tp:2']);
  });

  it('emits doppler-shaped activity calendar when subjectId is set', () => {
    const catalog = touchpointCatalogFromWire({
      touchpoints: [
        { id: 'touchpoint:pre', label: 'Open app', locus: 'digital', journeyPhase: 'pre-visit' },
        { id: 'touchpoint:on', label: 'Live map', locus: 'physical', journeyPhase: 'on-site' },
      ],
    });
    const result = generateEpisodeCalendar({
      source: 'scenes',
      scenes: commuteScenes,
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 10,
      planningHorizonDays: 42,
      touchpointCatalog: catalog,
      subjectId: 'persona:rider',
    });
    expect(result.activityCalendar?.subjectId).toBe('persona:rider');
    expect(result.activityCalendar?.days.length).toBe(42);
    const withActivities = result.activityCalendar?.days.filter((d) => d.activities.length > 0);
    expect(withActivities?.length).toBeGreaterThan(0);
    const block = withActivities?.[0]?.activities[0];
    expect(block?.kind).toBeDefined();
    expect(block?.label).not.toBe(block?.touchpointId);
  });

  it('buildEpisodeCalendarDays maps schedule rows to ISO dates', () => {
    const { episodeArc } = generateEpisodeCalendar({
      source: 'scenes',
      scenes: commuteScenes,
      simulationEpochStart: '2026-01-06',
      visitDayIndex: 10,
      planningHorizonDays: 42,
    });
    const days = buildEpisodeCalendarDays({ episodeArc, includeEmptyDays: true });
    expect(days.planningHorizonDays).toBe(42);
    expect(Object.keys(days.byIsoDate).length).toBe(42);
    const visitIso = simulationDateIso(10, '2026-01-06');
    expect(days.byIsoDate[visitIso]?.some((row) => row.phase === 'on_site')).toBe(true);
  });
});
