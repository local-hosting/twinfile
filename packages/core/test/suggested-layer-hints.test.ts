import { describe, expect, it } from 'vitest';

import { suggestedLayerHints, VISITS_LAYER_HINT } from '../src/cli/suggested-layer-hints.js';

describe('suggestedLayerHints', () => {
  it('includes visits hint when visits is suggested', () => {
    expect(suggestedLayerHints(['routes', 'visits'])).toEqual([VISITS_LAYER_HINT]);
  });

  it('is empty when visits is not suggested', () => {
    expect(suggestedLayerHints(['routes', 'assets'])).toEqual([]);
  });
});
