import { STORY_NARRATIVE_SPEC_VERSION } from '../types/story-narrative-spec.js';
import { normalizeStoryAssociations } from './normalize-story-associations.js';

function resolveStoryNarrativeSpecVersion(raw: Record<string, unknown>): number {
  const fromStorySpec = raw.storySpec;
  const fromVersion = raw.version;
  const specFields = [fromStorySpec, fromVersion].filter((value) => value !== undefined);
  if (specFields.length > 1 && new Set(specFields).size > 1) {
    throw new Error(
      `storySpec (${fromStorySpec}) and version (${fromVersion}) must agree (story narrative spec)`,
    );
  }
  const resolved = fromStorySpec ?? fromVersion ?? STORY_NARRATIVE_SPEC_VERSION;
  if (typeof resolved !== 'number' || !Number.isInteger(resolved)) {
    throw new Error('storySpec must be an integer story narrative spec version');
  }
  return resolved;
}

function isoDateStringFromYaml(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
}

/** Fold `storySpec` / legacy `version` → `version` before Zod parse. */
export function normalizeStoryInput(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) {
    return input;
  }
  const raw = input as Record<string, unknown>;
  const binding = raw.binding;
  if (typeof binding === 'object' && binding !== null) {
    const bindingRecord = binding as Record<string, unknown>;
    raw.binding = {
      ...bindingRecord,
      simulationEpochStart: isoDateStringFromYaml(bindingRecord.simulationEpochStart),
    };
  }
  const specVersion = resolveStoryNarrativeSpecVersion(raw);
  if (specVersion !== STORY_NARRATIVE_SPEC_VERSION) {
    throw new Error(
      `Unsupported story narrative spec ${specVersion} (supported: ${STORY_NARRATIVE_SPEC_VERSION})`,
    );
  }
  const { storySpec: _storySpec, ...rest } = raw;
  return normalizeStoryAssociations({ ...rest, version: specVersion });
}
