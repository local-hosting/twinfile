import { describe, expect, it } from 'vitest';
import { resolveStoryBeatSceneJobIds } from '../../src/contract/narrative/story/resolve-beat-scene-job-ids.js';
import type { EpisodeArcV1 } from '../../src/contract/narrative/types/episode-arc.js';

const arc: EpisodeArcV1 = {
  version: 1,
  simulationEpochStart: '2026-01-01',
  planningHorizonDays: 7,
  visitDayIndex: 6,
  objectiveTouchpointIds: [],
  phases: {
    pre_visit: { startDayIndex: 0, endDayIndex: 5 },
    on_site: { dayIndex: 6 },
    post_visit: { startDayIndex: 6, endDayIndex: 6 },
  },
  touchpointSchedule: [],
};

describe('resolveStoryBeatSceneJobIds', () => {
  it('returns scene job ids at beat day plus activity job', () => {
    const jobIds = resolveStoryBeatSceneJobIds({
      beat: {
        dayIndex: 0,
        activity: { id: 'a1', kind: 'transaction', startTime: 9, endTime: 10, jobId: 'job:activity' },
      },
      scenes: [
        { id: 's1', label: 'Open', order: 0, actId: 'exposition', characterIds: [], venueKey: 'venue:test', jobIds: ['job:scene'] },
        { id: 's2', label: 'Close', order: 1, actId: 'denouement', characterIds: [], venueKey: 'venue:test', jobIds: ['job:other'] },
      ],
      arc,
    });
    expect(jobIds).toContain('job:scene');
    expect(jobIds).toContain('job:activity');
  });
});
