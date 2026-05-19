import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadPCM } from '../../../src/contract/persona/contract/load-pcm.js';
import { savePCM } from '../../../src/contract/persona/contract/save-pcm.js';
import type { PCM } from '../../../src/contract/persona/types/pcm.js';

const sample: PCM = {
  version: 1,
  id: 'persona:tech-titans',
  title: 'Tech Titans',
  revision: 1,
  persona: {
    id: 'persona:tech-titans',
    label: 'Tech Titans',
    quote: 'Always on the latest gear.',
    segment: 'tech-titans',
    goals: [],
    frustrations: [],
    jobIds: [],
  },
  jobs: [],
  signalValues: {
    'attitude-tech-always-connected': 0.85,
    'attitude-tech-tech-comfort': 0.9,
  },
};

describe('savePCM / loadPCM values.yml', () => {
  it('round-trips compact signalValues', () => {
    const root = mkdtempSync(join(tmpdir(), 'pcm-values-rt-'));
    try {
      savePCM(root, sample);
      expect(statSync(join(root, 'signals', 'values.yml')).isFile()).toBe(true);
      const raw = readFileSync(join(root, 'signals', 'values.yml'), 'utf8');
      expect(raw).toContain('attitude-tech-always-connected');

      const { pcm } = loadPCM(root);
      expect(pcm.signalValues).toEqual(sample.signalValues);
      expect(pcm.id).toBe(sample.id);
      expect(pcm.persona.label).toBe('Tech Titans');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
