import { describe, expect, it } from 'vitest';
import type { Journey } from '@local-hosting/twinfile-character/pcm';

import { compileSAM } from '../../src/contract/narrative/contract/compile-sam.js';
import { extractJourneyTouchpointSequence } from '../../src/contract/narrative/journey/extract-touchpoint-sequence.js';
import { parseSAM } from '../../src/contract/narrative/schemas/sam.schema.js';
import { touchpointIndexFromIds } from '../../src/contract/narrative/types/touchpoint-index.js';

const riderCommute = {
  id: 'journey:rider-commute',
  label: 'Rider morning commute',
  personaId: 'persona:rider',
  phases: [
    {
      id: 'phase:rider-plan',
      label: 'Plan',
      order: 0,
      jobIds: ['need:commute-work'],
      touchpointIds: ['touchpoint:rider-open-home'],
      emotions: { band: 'mid' },
    },
    {
      id: 'phase:rider-request',
      label: 'Request',
      order: 1,
      jobIds: ['need:commute-work'],
      touchpointIds: ['touchpoint:rider-set-dest'],
      emotions: { band: 'mid' },
      moments: [
        {
          id: 'moment:rider-confirm-dest',
          label: 'Confirm destination',
          order: 0,
          touchpointIds: ['touchpoint:rider-confirm-dest'],
        },
      ],
    },
    {
      id: 'phase:rider-wait',
      label: 'Wait & ride',
      order: 2,
      jobIds: ['need:wait-eta'],
      touchpointIds: ['touchpoint:rider-live-map'],
      emotions: { band: 'high' },
    },
  ],
} as Journey;

describe('episode arc from SAM scenes', () => {
  it('extracts touchpoints in phase and moment order', () => {
    expect(extractJourneyTouchpointSequence(riderCommute)).toEqual([
      'touchpoint:rider-open-home',
      'touchpoint:rider-set-dest',
      'touchpoint:rider-confirm-dest',
      'touchpoint:rider-live-map',
    ]);
  });

  it('compileSAM fills episodeArc from storyboard scenes', () => {
    const sam = parseSAM({
      id: 'story:episode:rider-commute-1',
      title: 'Commute run',
      revision: 1,
      characters: [{ pcmId: 'persona:rider', primary: true }],
      venues: [{ venueKey: 'venue:home' }],
      arcTemplate: {
        id: 'arc:commute',
        label: 'Commute',
        kind: 'man_in_a_hole',
        acts: [
          { id: 'exposition', label: 'Plan', order: 0 },
          { id: 'denouement', label: 'Ride', order: 1 },
        ],
      },
      scenes: [
        {
          id: 'scene:plan',
          label: 'Plan',
          order: 0,
          actId: 'exposition',
          characterIds: ['persona:rider'],
          venueKey: 'venue:home',
          touchpointIds: ['touchpoint:rider-open-home'],
        },
        {
          id: 'scene:request',
          label: 'Request',
          order: 1,
          actId: 'exposition',
          characterIds: ['persona:rider'],
          venueKey: 'venue:home',
          touchpointIds: ['touchpoint:rider-set-dest', 'touchpoint:rider-confirm-dest'],
        },
        {
          id: 'scene:ride',
          label: 'Ride',
          order: 2,
          actId: 'denouement',
          characterIds: ['persona:rider'],
          venueKey: 'venue:home',
          touchpointIds: ['touchpoint:rider-live-map'],
        },
      ],
      binding: {
        pcmId: 'persona:rider',
        journeyId: 'journey:rider-commute',
        simulationEpochStart: '2026-01-06',
        visitDayIndex: 21,
      },
    });
    const index = touchpointIndexFromIds([
      'touchpoint:rider-open-home',
      'touchpoint:rider-set-dest',
      'touchpoint:rider-confirm-dest',
      'touchpoint:rider-live-map',
    ]);
    const result = compileSAM({ sam, journey: riderCommute, touchpointIndex: index });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sam.episodeArc?.objectiveTouchpointIds).toHaveLength(4);
  });
});
