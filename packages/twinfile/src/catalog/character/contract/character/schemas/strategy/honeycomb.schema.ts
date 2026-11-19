import { z } from 'zod';

import { HONEYCOMB_FACET_IDS } from '../../types/strategy/honeycomb.js';

export const HoneycombFacetIdSchema = z.enum(HONEYCOMB_FACET_IDS);

export const StrategyHoneycombFacetsSchema = z
  .array(HoneycombFacetIdSchema)
  .refine((facets) => new Set(facets).size === facets.length, {
    message: 'facets must be unique',
  });
