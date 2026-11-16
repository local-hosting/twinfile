import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadPCM } from '../../../src/contract/persona/contract/load-pcm.js';
import { savePCM } from '../../../src/contract/persona/contract/save-pcm.js';
import {
  demographicProfileFromPcm,
  personaProfileFromPcm,
  psychographicSegmentProfileFromPcm,
} from '../../../src/contract/persona/people/customer/profile/profiles-from-pcm.js';
import type { PCM } from '../../../src/contract/persona/types/pcm.js';
import type { SignalDimension } from '../../../src/contract/persona/types/story/signal-dimension.js';

const dimensions: SignalDimension[] = [
  {
    id: 'attitude-tech-always-connected',
    category: 'attitude',
    label: 'Always connected',
    unit: 'ratio',
    group: 'tech',
    lowLabel: 'Fine offline',
    highLabel: 'Always online',
  },
  {
    id: 'psychographic-technology-trends-accessible-no-matter-where-iam',
    category: 'psychographic',
    label: 'Accessible anywhere',
    unit: 'percent',
  },
];

const sample: PCM = {
  version: 1,
  id: 'persona:tech-titans',
  title: 'Tech Titans',
  revision: 1,
  persona: {
    id: 'persona:tech-titans',
    label: 'Tech Titans',
    quote: 'Show me performance.',
    segment: 'tech-titan',
    goals: [],
    frustrations: [],
    jobIds: [],
    exemplar: { id: 'aaron-chen', name: 'Aaron Chen', age: 29, interestIds: ['i1'], painPointIds: [] },
    empathy: {
      think: ['Specs matter'],
      feel: { positive: ['Impressed'], negative: [] },
      say: { positive: [], negative: [] },
      do: ['Benchmarks'],
      feelings: { positive: ['Productive'], negative: [] },
      phases: { sales: { Awareness: { thinking: ['Is it better?'] } } },
    },
    demographic: { aspects: [], attributes: { income: { '$100k+': 44 } } },
  },
  jobs: [],
  signalValues: {
    'attitude-tech-always-connected': 0.85,
    'psychographic-technology-trends-accessible-no-matter-where-iam': 84,
  },
  overview: { name: 'Tech Titans', percentage: 16 },
  emotions: { currentEmotions: { frustrationTriggers: ['Slow'] } },
  strategy: { acquisition: { strategies: ['Demo'] }, scenarios: {} },
  mentalModelScope: { byFocus: { wifi: { mentalSpaces: [] } } },
  objectives: [{ intentId: 'upgrade', validLevelIds: ['regular'], touchpointSequences: { regular: ['a'] } }],
};

describe('savePCM / loadPCM segment facets', () => {
  it('round-trips slot files and compact topic rows', () => {
    const root = mkdtempSync(join(tmpdir(), 'pcm-segment-rt-'));
    try {
      savePCM(root, sample);
      expect(statSync(join(root, 'mental-models', 'scope.yml')).isFile()).toBe(true);
      expect(statSync(join(root, 'journeys', 'objectives.yml')).isFile()).toBe(true);

      const { pcm } = loadPCM(root);
      expect(pcm.overview).toEqual(sample.overview);
      expect(pcm.emotions?.currentEmotions?.frustrationTriggers).toEqual(['Slow']);
      expect(pcm.strategy?.acquisition?.strategies).toEqual(['Demo']);
      expect(pcm.mentalModelScope).toEqual(sample.mentalModelScope);
      expect(pcm.objectives).toEqual(sample.objectives);
      expect(pcm.mentalModels).toBeUndefined();
      expect(pcm.journeys).toEqual([]);
      expect(pcm.persona.empathy?.phases).toEqual(sample.persona.empathy?.phases);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('publishes segment, persona, and demographic profiles', () => {
    const segment = psychographicSegmentProfileFromPcm(sample, dimensions);
    expect(segment.id).toBe('tech-titan');
    expect(segment.exemplarPersonaId).toBe('aaron-chen');
    expect(segment.attitudes?.attitudes.attitudeScales?.tech?.alwaysConnected).toEqual({
      highStatement: 'Always online',
      lowStatement: 'Fine offline',
      value: 0.85,
    });
    expect(segment.attitudes?.attitudes.psychographics?.technologyTrends?.accessibleNoMatterWhereIAm).toBe(84);
    expect(segment.empathy?.empathy.segment).toBe('tech-titan');
    expect(segment.mentalModel?.mentalModel.segment).toBe('tech-titan');
    expect(segment.objectives).toHaveLength(1);

    const persona = personaProfileFromPcm(sample);
    expect(persona).toMatchObject({
      id: 'aaron-chen',
      label: 'Aaron Chen',
      quote: 'Show me performance.',
      segmentAffinities: [{ segmentId: 'tech-titan', weight: 1 }],
    });
    expect(persona?.empathy?.do).toEqual(['Benchmarks']);

    expect(demographicProfileFromPcm(sample)).toEqual({
      id: 'tech-titan',
      label: 'Tech Titans',
      segmentId: 'tech-titan',
      attributes: { income: { '$100k+': 44 } },
    });
  });
});
