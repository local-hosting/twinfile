import { describe, expect, it } from 'vitest';

import { pcmFromJSON, pcmToJSON } from '../../src/contract/persona/contract/json.js';
import { parsePCM } from '../../src/contract/persona/schemas/pcm.schema.js';
import { PCM_SPEC_VERSION, pcmSpecVersion } from '../../src/contract/persona/types/pcm-spec.js';

const persona = {
  id: 'persona:a',
  label: 'A',
  quote: 'x',
  goals: [],
  frustrations: [],
  segment: 'general',
};

const job = {
  id: 'job:1',
  text: 'Finish the task',
  when: 'I open the product',
  want: 'to finish quickly',
  so: 'I can move on',
};

describe('PCMSpec', () => {
  it('defaults spec version when omitted', () => {
    const pcm = parsePCM({
      id: 'persona:a',
      title: 'A',
      revision: 1,
      persona,
      jobs: [job],
    });
    expect(pcm.version).toBe(PCM_SPEC_VERSION);
    expect(pcmSpecVersion(pcm)).toBe(1);
  });

  it('accepts pcmSpec on disk alias', () => {
    const pcm = parsePCM({
      pcmSpec: 1,
      id: 'persona:a',
      title: 'A',
      revision: 1,
      persona,
      jobs: [job],
    });
    expect(pcm.version).toBe(1);
  });

  it('rejects conflicting pcmSpec and version', () => {
    expect(() =>
      parsePCM({
        pcmSpec: 1,
        version: 2,
        id: 'persona:a',
        title: 'A',
        revision: 1,
        persona,
        jobs: [job],
      }),
    ).toThrow(/must agree/);
  });

  it('pcmToJSON always includes document.version (spec)', () => {
    const json = pcmToJSON(
      parsePCM({
        id: 'persona:a',
        title: 'A',
        revision: 3,
        persona,
        jobs: [job],
      }),
    );
    const doc = json.document as Record<string, unknown>;
    expect(doc.version).toBe(1);
    expect(doc.revision).toBe(3);
    expect(pcmFromJSON(json).revision).toBe(3);
  });
});
