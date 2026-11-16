import { describe, expect, it } from 'vitest';

import { buildJourney } from '../../src/contract/narrative/journey/build/build-journey.js';
import { formatJourneyMarkdown } from '../../src/contract/narrative/journey/build/format-journey-markdown.js';
import type { StoryJourneyContext } from '../../src/contract/narrative/types/story-narrative-journey.js';
import { storyboardStoryFixture } from './helpers/storyboard-story-fixture.js';

const story = storyboardStoryFixture({
  id: 'story:episode:core-run',
  title: 'Core run',
  characters: [{ characterId: 'persona:commuter', primary: true }],
  binding: {
    characterId: 'persona:commuter',
    journeyId: 'journey:core',
    simulationEpochStart: '2026-01-01',
  },
});

function rubricContext(): StoryJourneyContext {
  const OBSTACLE = 'obstacle:no-wait-time';
  return {
    journeys: [
      {
        id: 'journey:core',
        label: 'Core journey',
        personaId: 'persona:commuter',
        journeyGoal: 'Get there',
        phases: [
          {
            id: 'phase:start',
            label: 'Start',
            order: 0,
            jobIds: [],
            touchpointIds: [],
            emotions: {},
            obstacles: [{ obstacleId: OBSTACLE, outcome: 'workaround' }],
          },
          {
            id: 'phase:finish',
            label: 'Finish',
            order: 1,
            jobIds: [],
            touchpointIds: [],
            emotions: {},
            obstacles: [{ obstacleId: OBSTACLE, outcome: 'overcome', overcomeWith: ['feat:core'] }],
          },
        ],
      },
    ],
    obstacles: [
      { id: OBSTACLE, text: 'No wait time shown', jobIds: ['job:core'], heart: 'task-success' },
    ],
  };
}

describe('buildJourney', () => {
  it('shows obstacles and HEART over time on the episode journey', () => {
    const built = buildJourney(story, rubricContext());
    const markdown = formatJourneyMarkdown(built);
    expect(built.storyId).toBe('story:episode:core-run');
    expect(built.journeyId).toBe('journey:core');
    expect(markdown).toContain('**Story:** `story:episode:core-run`');
    expect(markdown).toContain('- No wait time shown — _workaround_');
    expect(markdown).toContain('## HEART over time');
    expect(markdown).toContain('| task-success | 0.50 | 0.45 | 0.55 | rising / held high |');
  });
});
