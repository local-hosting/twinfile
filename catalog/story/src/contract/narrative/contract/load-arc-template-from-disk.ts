import { join } from 'node:path';

import { StoryArcActSchema } from '../schemas/story-arc-template.schema.js';
import type { StoryArcKind } from '../types/story-arc-kind.js';
import type { StoryArcAct, StoryArcTemplate } from '../types/story-arc-template.js';
import { StoryArcKindSchema } from '../schemas/story-arc-kind.schema.js';
import { loadEntityDir } from './io.js';

function sortActs(acts: StoryArcAct[]): StoryArcAct[] {
  return [...acts].sort((left, right) => left.order - right.order);
}

function parseDiskActs(actsDir: string): StoryArcAct[] {
  const rows = loadEntityDir<unknown>(actsDir);
  return rows.map((row) => StoryArcActSchema.parse(row));
}

/**
 * Merge `acts/*.yml` into `arcTemplate` from `sam.yml`.
 * Header fields (`id`, `label`, `description`) stay on `sam.yml`; act rows load from disk when present.
 */
export function mergeArcTemplateFromDisk(
  raw: Record<string, unknown>,
  root: string,
): StoryArcTemplate | undefined {
  const actsDir = join(root, 'acts');
  const diskActs = parseDiskActs(actsDir);
  const header = raw.arcTemplate;

  if (diskActs.length === 0) {
    return header as StoryArcTemplate | undefined;
  }

  if (typeof header !== 'object' || header === null) {
    throw new Error(
      `SAM root ${root} has acts/ but sam.yml is missing arcTemplate (id, label required)`,
    );
  }

  const arcHeader = header as Record<string, unknown>;
  const id = typeof arcHeader.id === 'string' ? arcHeader.id.trim() : '';
  const label = typeof arcHeader.label === 'string' ? arcHeader.label.trim() : '';
  if (!id || !label) {
    throw new Error(`SAM root ${root}: arcTemplate.id and arcTemplate.label are required when acts/ is used`);
  }

  const description =
    typeof arcHeader.description === 'string' ? arcHeader.description.trim() : undefined;

  const kindRaw = arcHeader.kind;
  const kindParsed = StoryArcKindSchema.safeParse(kindRaw);
  if (!kindParsed.success) {
    throw new Error(
      `SAM root ${root}: arcTemplate.kind is required (one of ${StoryArcKindSchema.options.join(', ')})`,
    );
  }

  return {
    id,
    label,
    kind: kindParsed.data,
    ...(description ? { description } : {}),
    acts: sortActs(diskActs),
  };
}
