import { describe, expect, it } from 'vitest';
import { join } from 'node:path';

import { buildPlaceJsonLdFromTwinfile, loadTwinfile } from '../src/index.js';
import { testExamplesRoot } from './catalog-test-roots.js';

const examplesRoot = testExamplesRoot(import.meta.dirname);
const examplesAirport = join(examplesRoot, 'airport');

describe('buildPlaceJsonLdFromTwinfile', () => {
  it('emits Schema.org JSON-LD for example airport place', () => {
    const loaded = loadTwinfile(examplesAirport);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const doc = buildPlaceJsonLdFromTwinfile(loaded.value);
    expect(doc).not.toBeNull();
    expect(doc?.['@type']).toBe('Airport');
    expect(doc?.['@id']).toBe('twinfile/airport:0.2.0');
    expect(doc?.name).toBe('John F. Kennedy International Airport');
  });
});
