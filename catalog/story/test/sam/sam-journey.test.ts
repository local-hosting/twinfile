import { describe, expect, it } from 'vitest';

import { buildJourney } from '../../src/contract/narrative/journey/build/build-journey.js';
import { formatJourneyMarkdown } from '../../src/contract/narrative/journey/build/format-journey-markdown.js';
import type { SamJourneyContext } from '../../src/contract/narrative/types/sam-journey.js';
import { storyboardSamFixture } from './helpers/storyboard-sam-fixture.js';

const sam = storyboardSamFixture({
  id: 'story:episode:core-run',
  title: 'Core run',
  characters: [{ pcmId: 'persona:commuter', primary: true }],
  binding: {
    pcmId: 'persona:commuter',
    journeyId: 'journey:core',
    simulationEpochStart: '2026-01-01',
  },
});

function rubricContext(): SamJourneyContext {
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
    const built = buildJourney(sam, rubricContext());
    const markdown = formatJourneyMarkdown(built);
    expect(built.samId).toBe('story:episode:core-run');
    expect(built.journeyId).toBe('journey:core');
    expect(markdown).toContain('**SAM:** `story:episode:core-run`');
    expect(markdown).toContain('- No wait time shown — _workaround_');
    expect(markdown).toContain('## HEART over time');
    expect(markdown).toContain('| task-success | 0.50 | 0.45 | 0.55 | rising / held high |');
  });
});
