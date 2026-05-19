import { describe, expect, it } from 'vitest';

import { samFromJSON, samToJSON } from '../../src/contract/narrative/contract/json.js';
import { parseSAM } from '../../src/contract/narrative/schemas/sam.schema.js';
import { SAM_SPEC_VERSION, samSpecVersion } from '../../src/contract/narrative/types/sam-spec.js';
import { storyboardSamFixture } from './helpers/storyboard-sam-fixture.js';

describe('SAMSpec', () => {
  it('defaults spec version when omitted', () => {
    const { version: _version, ...body } = storyboardSamFixture();
    const sam = parseSAM(body);
    expect(sam.version).toBe(SAM_SPEC_VERSION);
    expect(samSpecVersion(sam)).toBe(1);
  });

  it('accepts samSpec on disk alias', () => {
    const { version: _version, ...body } = storyboardSamFixture();
    const sam = parseSAM({ samSpec: 1, ...body });
    expect(sam.version).toBe(1);
  });

  it('rejects conflicting samSpec and version', () => {
    const { version: _version, ...body } = storyboardSamFixture();
    expect(() => parseSAM({ samSpec: 1, version: 2, ...body })).toThrow(/must agree/);
  });

  it('samToJSON always includes document.version (spec)', () => {
    const json = samToJSON(storyboardSamFixture()) as { document: { version: number } };
    expect(json.document.version).toBe(1);
  });

  it('round-trips replication JSON', () => {
    const source = storyboardSamFixture();
    const restored = samFromJSON(samToJSON(source));
    expect(restored.id).toBe(source.id);
    expect(restored.binding).toEqual(source.binding);
    expect(restored.characters).toEqual(source.characters);
  });
});
