import { statSync } from 'node:fs';
import { join } from 'node:path';

import { readYamlFile } from './io.js';
import type { CharacterSegmentFacets } from '../types/character-segment-facets.js';

/** Single-file segment slots beside `character.yml` (file body is the slot value). */
export const CHARACTER_SEGMENT_FACET_FILES = {
  overview: 'overview.yml',
  visitFrequency: 'visit-frequency.yml',
  emotions: 'emotions.yml',
  behavior: 'behavior.yml',
  services: 'services.yml',
  strategy: 'strategy.yml',
} as const satisfies Partial<Record<keyof CharacterSegmentFacets, string>>;

/** Compact scope row inside `mental-models/` — no `id`, unlike skyline mental models. */
export const CHARACTER_MENTAL_MODEL_SCOPE_FILE = 'scope.yml';

/** Compact `{ objectives }` row inside `journeys/` — no `id`, unlike journeys. */
export const CHARACTER_OBJECTIVES_FILE = 'objectives.yml';

export type CharacterSegmentFacetFileKey = keyof typeof CHARACTER_SEGMENT_FACET_FILES;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Read whichever single-file segment slots exist on a Character root. */
export function loadCharacterSegmentFacetFiles(root: string): Partial<Record<CharacterSegmentFacetFileKey, unknown>> {
  const out: Partial<Record<CharacterSegmentFacetFileKey, unknown>> = {};
  for (const [key, file] of Object.entries(CHARACTER_SEGMENT_FACET_FILES) as [CharacterSegmentFacetFileKey, string][]) {
    const path = join(root, file);
    if (statSync(path, { throwIfNoEntry: false })?.isFile()) {
      out[key] = readYamlFile(path);
    }
  }
  return out;
}

/** Split `mental-models/` topic: skyline models vs the id-less segment scope row. */
export function partitionCharacterMentalModelTopic(raw: unknown[]): {
  mentalModels: unknown[];
  mentalModelScope?: unknown;
} {
  const mentalModels: unknown[] = [];
  let mentalModelScope: unknown;
  for (const row of raw) {
    if (isRecord(row) && row.id === undefined && row.stacks === undefined) {
      if (mentalModelScope !== undefined) {
        throw new Error('mental-models/ may hold only one id-less scope row');
      }
      mentalModelScope = row;
      continue;
    }
    mentalModels.push(row);
  }
  return { mentalModels, ...(mentalModelScope !== undefined ? { mentalModelScope } : {}) };
}

/** Split `journeys/` topic: journeys vs the id-less `{ objectives }` row. */
export function partitionCharacterJourneyTopic(raw: unknown[]): {
  journeys: unknown[];
  objectives?: unknown[];
} {
  const journeys: unknown[] = [];
  let objectives: unknown[] | undefined;
  for (const row of raw) {
    if (isRecord(row) && row.id === undefined && Array.isArray(row.objectives)) {
      objectives = [...(objectives ?? []), ...row.objectives];
      continue;
    }
    journeys.push(row);
  }
  return { journeys, ...(objectives ? { objectives } : {}) };
}
