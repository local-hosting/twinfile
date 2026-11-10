import { describe, expect, it } from 'vitest';
import {
  buildStoryBrief,
  formatBriefMarkdown,
  joinBriefSections,
  briefSection,
} from '../../../../../src/catalog/story/contract/narrative/brief/index.js';

describe('formatBriefMarkdown', () => {
  it('renders headline and bullet sections', () => {
    const md = formatBriefMarkdown(
      joinBriefSections('Story brief — episode-1', [
        briefSection('Who', ['Segment `early-adopter`']),
        briefSection('Where', ['Store `SAC06`']),
      ]),
    );
    expect(md).toContain('Story brief — episode-1');
    expect(md).toContain('**Who**');
    expect(md).toContain('- Segment `early-adopter`');
    expect(md).toContain('**Where**');
    expect(md).toContain('- Store `SAC06`');
  });
});

describe('buildStoryBrief', () => {
  it('maps dimension snapshot to sections', () => {
    const brief = buildStoryBrief({
      snapshot: {
        storyId: 'character-1',
        characterId: 'character-1',
        storyPitch: 'Explorer at Polaris.',
        who: { segmentId: 'early-adopter' },
        what: { storyId: 'story:store-visit', startStoreVisitJourney: true },
        where: { storeSlug: 'SAC06', lat: 40.1, lon: -82.9, h3Cell: '852a957b' },
        when: { useFeedCalendar: true },
        why: { engagementLevelId: 'explorer', intentIds: ['setup'], focusAreaId: 'mobile-phones' },
      },
      character: {
        id: 'character-1',
        characterId: 'character-1',
        name: 'Jeanette Colon',
      },
    });

    const md = formatBriefMarkdown(brief);
    expect(md).toContain('Jeanette Colon');
    expect(md).toContain('story:store-visit');
    expect(md).toContain('mobile-phones');
    expect(md).toContain('Explorer at Polaris.');
  });

  it('lists episode touchpoint count and order from storyArc', () => {
    const brief = buildStoryBrief({
      snapshot: {
        storyId: 'ep-1',
        when: {
          planningHorizonDays: 56,
          storyArc: {
            version: 1,
            simulationEpochStart: '2026-09-28',
            planningHorizonDays: 56,
            visitDayIndex: 28,
            objectiveTouchpointIds: ['direct-mail', 'rep-station', 'smart-appts-feedback'],
            phases: {
              pre_visit: { startDayIndex: 0, endDayIndex: 27 },
              on_site: { dayIndex: 28 },
              post_visit: { startDayIndex: 29, endDayIndex: 55 },
            },
            touchpointSchedule: [],
          },
        },
      },
    });

    const md = formatBriefMarkdown(brief);
    expect(md).toContain('Episode touchpoints (3):');
    expect(md).toContain('`direct-mail` → `rep-station` → `smart-appts-feedback`');
    expect(md).not.toContain('JTBD touchpoints');
  });
});
