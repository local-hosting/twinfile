import { describe, expect, it } from 'vitest';
import {
  loadMyersBriggsCatalog,
  mbtiDimensionsFromTypeId,
  resolveMbtiTypeDefinition,
} from '../../src/contract/persona/myers-briggs/index.js';

describe('myers-briggs (character)', () => {
  it('loads sixteen personality types from yaml', () => {
    const catalog = loadMyersBriggsCatalog();
    expect(catalog.frameworkId).toBe('myers_briggs');
    expect(catalog.types).toHaveLength(16);
    expect(catalog.types.map((row) => row.id)).toContain('ENTJ');
  });

  it('derives dimensions from a four-letter type id', () => {
    expect(mbtiDimensionsFromTypeId('ENTJ')).toEqual({
      energy: 'E',
      perception: 'N',
      deciding: 'T',
      lifestyle: 'J',
    });
  });

  it('resolves catalog type definitions', () => {
    const type = resolveMbtiTypeDefinition('ENTJ');
    expect(type.label).toBe('Commander');
  });
});
