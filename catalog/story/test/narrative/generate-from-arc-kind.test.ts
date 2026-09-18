import { describe, expect, it } from 'vitest';
import type { Journey } from '@local-hosting/twinfile-character/character';

import { compileStory } from '../../src/contract/narrative/contract/compile-story-narrative.js';
import {
  buildStoryArcTemplateFromKind,
  generateStoryEpisodeFromArc,
} from '../../src/contract/narrative/story-arc/generate-from-arc-kind.js';
import { STORY_ARC_KINDS } from '../../src/contract/narrative/types/story-arc-kind.js';
import { parseStory } from '../../src/contract/narrative/schemas/story-narrative.schema.js';

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

describe('generateStoryEpisodeFromArc', () => {
  it('builds arc templates for all six Write Practice kinds', () => {
    for (const kind of STORY_ARC_KINDS) {
      const arc = buildStoryArcTemplateFromKind({ kind });
      expect(arc.kind).toBe(kind);
      expect(arc.acts.length).toBeGreaterThan(0);
    }
  });

  it('scaffolds scenes and compiles calendar for any arc kind', () => {
    for (const kind of ['man_in_a_hole', 'cinderella', 'icarus'] as const) {
      const draft = generateStoryEpisodeFromArc({
        kind,
        journey: commute,
        storyId: 'story:episode:test',
        title: 'Test',
        revision: 1,
        focalCharacterId: 'persona:rider',
        placeRef: 'twinfile/place/demo:0.0.0',
        simulationEpochStart: '2026-01-06',
        visitDayIndex: 10,
        planningHorizonDays: 42,
      });

      const story = parseStory({
        version: 1,
        id: draft.binding.characterId,
        title: 'Test',
        revision: 1,
        places: [{ placeRef: 'twinfile/place/demo:0.0.0' }],
        ...draft,
      });

      const compiled = compileStory({ story, journey: commute, force: true });
      expect(compiled.ok).toBe(true);
      if (!compiled.ok) return;
      expect(compiled.story.episodeArc?.objectiveTouchpointIds).toEqual([
        'touchpoint:open',
        'touchpoint:map',
      ]);
    }
  });
});
