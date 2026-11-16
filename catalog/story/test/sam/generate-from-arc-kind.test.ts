import { describe, expect, it } from 'vitest';
import type { Journey } from '@local-hosting/twinfile-character/pcm';

import { compileSAM } from '../../src/contract/narrative/contract/compile-sam.js';
import {
  buildStoryArcTemplateFromKind,
  generateSamEpisodeFromArc,
} from '../../src/contract/narrative/story-arc/generate-from-arc-kind.js';
import { STORY_ARC_KINDS } from '../../src/contract/narrative/types/story-arc-kind.js';
import { parseSAM } from '../../src/contract/narrative/schemas/sam.schema.js';

const commute = {
  id: 'journey:rider-commute',
  label: 'Commute',
  personaId: 'persona:rider',
  phases: [
    {
      id: 'phase:a',
      label: 'Plan',
      order: 0,
      jobIds: ['need:a'],
      touchpointIds: ['touchpoint:open'],
      emotions: { band: 'mid', valence: 'neutral' },
    },
    {
      id: 'phase:b',
      label: 'Ride',
      order: 1,
      jobIds: ['need:a'],
      touchpointIds: ['touchpoint:map'],
      emotions: { band: 'high', valence: 'positive' },
    },
  ],
} as Journey;

describe('generateSamEpisodeFromArc', () => {
  it('builds arc templates for all six Write Practice kinds', () => {
    for (const kind of STORY_ARC_KINDS) {
      const arc = buildStoryArcTemplateFromKind({ kind });
      expect(arc.kind).toBe(kind);
      expect(arc.acts.length).toBeGreaterThan(0);
    }
  });

  it('scaffolds scenes and compiles calendar for any arc kind', () => {
    for (const kind of ['man_in_a_hole', 'cinderella', 'icarus'] as const) {
      const draft = generateSamEpisodeFromArc({
        kind,
        journey: commute,
        episodeId: 'story:episode:test',
        title: 'Test',
        revision: 1,
        focalPcmId: 'persona:rider',
        venueKey: 'venue:demo',
        simulationEpochStart: '2026-01-06',
        visitDayIndex: 10,
        planningHorizonDays: 42,
      });

      const sam = parseSAM({
        version: 1,
        id: draft.binding.pcmId,
        title: 'Test',
        revision: 1,
        venues: [{ venueKey: 'venue:demo' }],
        ...draft,
      });

      const compiled = compileSAM({ sam, journey: commute, force: true });
      expect(compiled.ok).toBe(true);
      if (!compiled.ok) return;
      expect(compiled.sam.episodeArc?.objectiveTouchpointIds).toEqual([
        'touchpoint:open',
        'touchpoint:map',
      ]);
    }
  });
});
