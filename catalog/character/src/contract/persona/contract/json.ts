import { omitNullishDeep } from '../axm/omit-nullish-deep.js';
import { parseCharacter } from '../schemas/character.schema.js';
import type { Character } from '../types/character.js';

export type CharacterJson = {
  document: Record<string, unknown>;
  persona: Record<string, unknown>;
  jobs?: unknown[];
  /** @deprecated Prefer `jobs`. */
  userNeeds?: unknown[];
  story?: Record<string, unknown>;
  strategy?: Record<string, unknown>;
};

/** Storage-neutral JSON export. */
export function characterToJSON(character: Character): Record<string, unknown> {
  const {
    persona,
    jobs,
    journeys,
    quotes,
    quoteTaxonomy,
    mentalModels,
    thinkingStyles,
    obstacles,
    signals,
    signalValues,
    id,
    title,
    revision,
    version,
    summary,
  } = character;

  const document: Record<string, unknown> = { version, id, title, revision };
  if (summary !== undefined) document.summary = summary;

  const preferCompactSignals = signalValues && Object.keys(signalValues).length > 0;

  return omitNullishDeep({
    document,
    persona,
    jobs: jobs ?? [],
    ...(journeys?.length || quotes?.length || quoteTaxonomy
      ? {
          story: omitNullishDeep({
            ...(journeys?.length ? { journeys } : {}),
            ...(quotes?.length ? { quotes } : {}),
            ...(quoteTaxonomy ? { quoteTaxonomy } : {}),
          }),
        }
      : {}),
    strategy: omitNullishDeep({
      ...(mentalModels?.length ? { mentalModels } : {}),
      ...(thinkingStyles?.length ? { thinkingStyles } : {}),
      ...(obstacles?.length ? { obstacles } : {}),
      ...(preferCompactSignals
        ? { signalValues }
        : signals?.length
          ? { signals }
          : {}),
    }),
  });
}

export function characterFromJSON(json: unknown): Character {
  const raw = json as CharacterJson & Record<string, unknown>;
  const doc = raw.document ?? {};
  const story = (raw.story ?? {}) as Record<string, unknown>;
  const strategy = (raw.strategy ?? {}) as Record<string, unknown>;
  const jobs = raw.jobs ?? raw.userNeeds ?? [];

  return parseCharacter({
    ...doc,
    persona: raw.persona,
    jobs,
    journeys: story.journeys,
    quotes: story.quotes,
    quoteTaxonomy: story.quoteTaxonomy,
    mentalModels: strategy.mentalModels,
    thinkingStyles: strategy.thinkingStyles,
    obstacles: strategy.obstacles,
    signals: strategy.signals,
    signalValues: strategy.signalValues,
  });
}
