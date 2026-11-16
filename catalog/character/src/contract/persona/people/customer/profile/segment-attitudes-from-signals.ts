import { z } from 'zod';

import type { SignalDimension } from '../../../types/story/signal-dimension.js';
import { SegmentAttitudesBodySchema } from './segment-facets.js';

export type SegmentAttitudesBody = z.infer<typeof SegmentAttitudesBodySchema>;

type GroupedValues = Record<string, Record<string, unknown>>;

function kebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function objectShape(schema: z.core.$ZodType): z.ZodRawShape {
  const inner = schema instanceof z.ZodOptional ? schema.unwrap() : schema;
  if (!(inner instanceof z.ZodObject)) {
    throw new Error('segmentAttitudesFromSignalValues: expected an object schema');
  }
  return inner.shape;
}

/** Walk `{ group: { key } }` schema keys; dimension id is `<category>-<group>-<key>` in kebab case. */
function groupValues(
  schema: z.ZodTypeAny,
  category: string,
  read: (dimensionId: string) => unknown,
): GroupedValues | undefined {
  const out: GroupedValues = {};
  for (const [group, groupSchema] of Object.entries(objectShape(schema))) {
    const row: Record<string, unknown> = {};
    for (const key of Object.keys(objectShape(groupSchema))) {
      const value = read(`${category}-${kebab(group)}-${kebab(key)}`);
      if (value !== undefined) row[key] = value;
    }
    if (Object.keys(row).length > 0) out[group] = row;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Rebuild the segment attitudes facet from Character `signalValues` joined with AXM signal dimensions. */
export function segmentAttitudesFromSignalValues(
  values: Readonly<Record<string, number>>,
  dimensions: readonly SignalDimension[],
): SegmentAttitudesBody | undefined {
  const dimensionsById = new Map(dimensions.map((dimension) => [dimension.id, dimension]));
  const shape = SegmentAttitudesBodySchema.shape;

  const attitudeScales = groupValues(shape.attitudeScales, 'attitude', (id) => {
    const value = values[id];
    if (value === undefined) return undefined;
    const dimension = dimensionsById.get(id);
    if (!dimension?.highLabel || !dimension.lowLabel) {
      throw new Error(`Signal dimension ${id} needs highLabel and lowLabel to build attitudes`);
    }
    return { highStatement: dimension.highLabel, lowStatement: dimension.lowLabel, value };
  });
  const psychographics = groupValues(shape.psychographics, 'psychographic', (id) => values[id]);

  if (!attitudeScales && !psychographics) return undefined;
  return SegmentAttitudesBodySchema.parse({
    ...(attitudeScales ? { attitudeScales } : {}),
    ...(psychographics ? { psychographics } : {}),
  });
}
