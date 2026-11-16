import { describe, expect, it } from 'vitest';
import { SamDocument } from '../../src/contract/narrative/contract/sam-document.js';
import { storyboardSamFixture } from './helpers/storyboard-sam-fixture.js';

describe('SamDocument', () => {
  it('toJSON round-trips via fromJSON', () => {
    const source = storyboardSamFixture();
    const doc = SamDocument.from(source);
    const json = doc.toJSON();
    expect(json.document).toMatchObject({ id: source.id });
    const restored = SamDocument.fromJSON(json);
    expect(restored.value.id).toBe(source.id);
  });
});
