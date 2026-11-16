import { join } from 'node:path';
import { statSync } from 'node:fs';

import { parseCharacter } from '../schemas/character.schema.js';
import type { Character } from '../types/character.js';
import type { ResearchSignal } from '../types/story/research-signal.js';
import { stripPersonaGroupFields } from './strip-group-fields.js';
import type { Persona } from '../types/strategy/persona.js';
import {
  loadEntityDir,
  loadTopicFolder,
  readYamlFile,
  resolveCharacterStrategyTopicRoot,
  resolveCharacterSubdir,
  STRATEGY_DIR_CANDIDATES,
} from './io.js';
import { loadCharacterStoryTopics } from './load-character-story-topics.js';
import {
  loadCharacterSegmentFacetFiles,
  partitionCharacterJourneyTopic,
  partitionCharacterMentalModelTopic,
} from './character-segment-topics.js';
import { CHARACTER_STRATEGY_TOPIC_MAP } from './topic-maps.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Split `signals/` topic: full research rows vs compact `{ values: { dimId: number } }`. */
export function partitionCharacterSignalTopic(raw: unknown[]): {
  signals: ResearchSignal[];
  signalValues?: Record<string, number>;
} {
  const signals: ResearchSignal[] = [];
  let signalValues: Record<string, number> | undefined;
  for (const row of raw) {
    if (!isRecord(row)) continue;
    if (isRecord(row.values) && row.category === undefined && row.id === undefined) {
      const next: Record<string, number> = { ...(signalValues ?? {}) };
      for (const [key, value] of Object.entries(row.values)) {
        if (typeof value === 'number' && key.trim()) {
          next[key.trim()] = value;
        }
      }
      signalValues = next;
      continue;
    }
    if (typeof row.id === 'string' && typeof row.category === 'string') {
      signals.push(row as ResearchSignal);
    }
  }
  return {
    signals,
    ...(signalValues && Object.keys(signalValues).length ? { signalValues } : {}),
  };
}

export type LoadCharacterResult = {
  character: Character;
};

function loadPersona(root: string): Persona {
  const characterPath = join(root, 'character.yml');
  if (statSync(characterPath, { throwIfNoEntry: false })?.isFile()) {
    return readYamlFile(characterPath) as Persona;
  }
  const nestedStrategy = resolveCharacterSubdir(root, STRATEGY_DIR_CANDIDATES);
  const personasDir = join(nestedStrategy, 'personas');
  const personas = loadEntityDir<Persona>(personasDir);
  if (personas.length === 0) {
    throw new Error(`Character root ${root} is missing character.yml or strategy/personas/*.yml`);
  }
  if (personas.length > 1) {
    throw new Error(`Character root ${root} must have exactly one persona (found ${personas.length})`);
  }
  return personas[0];
}

/**
 * Load a Character root from disk (`character.yml` + topic folders on the root).
 * Strategy topics (`needs/`, `mental-models/`, …) and story topics (`journeys/`, `quotes/`)
 * live beside `character.yml`. Nested `strategy/` / `a-strategy/` still resolve when present.
 */
export function loadCharacter(root: string): LoadCharacterResult {
  const characterYml = join(root, 'character.yml');
  if (!statSync(characterYml, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Character root ${root} is missing character.yml`);
  }
  const header = readYamlFile(characterYml) as Record<string, unknown>;
  const persona = stripPersonaGroupFields(loadPersona(root));
  const strategyTopicRoot = resolveCharacterStrategyTopicRoot(
    root,
    Object.keys(CHARACTER_STRATEGY_TOPIC_MAP),
  );
  const strategySlice = loadTopicFolder(strategyTopicRoot, CHARACTER_STRATEGY_TOPIC_MAP);
  const storySlice = loadCharacterStoryTopics(root);
  const signalTopic = partitionCharacterSignalTopic(
    Array.isArray(strategySlice.signals) ? (strategySlice.signals as unknown[]) : [],
  );

  const mentalModelTopic = partitionCharacterMentalModelTopic(
    Array.isArray(strategySlice.mentalModels) ? (strategySlice.mentalModels as unknown[]) : [],
  );
  const journeyTopic = partitionCharacterJourneyTopic(storySlice.journeys);

  const ownerId = persona.id;
  const mentalModels = mentalModelTopic.mentalModels.map((model) => {
    if (!model || typeof model !== 'object') return model;
    const row = model as Record<string, unknown>;
    const personaIds = row.personaIds;
    if (Array.isArray(personaIds) && personaIds.length > 0) return model;
    return { ...row, personaIds: [ownerId] };
  });

  const character = parseCharacter({
    ...header,
    persona,
    jobs: strategySlice.jobs ?? [],
    mentalModels: mentalModels.length ? mentalModels : undefined,
    thinkingStyles: strategySlice.thinkingStyles,
    dimensions: strategySlice.dimensions,
    attributes: strategySlice.attributes,
    audiences: strategySlice.audiences,
    obstacles: strategySlice.obstacles,
    signals: signalTopic.signals,
    ...(signalTopic.signalValues ? { signalValues: signalTopic.signalValues } : {}),
    journeys: journeyTopic.journeys,
    quotes: storySlice.quotes,
    ...(storySlice.quoteTaxonomy ? { quoteTaxonomy: storySlice.quoteTaxonomy } : {}),
    ...loadCharacterSegmentFacetFiles(root),
    ...(mentalModelTopic.mentalModelScope !== undefined
      ? { mentalModelScope: mentalModelTopic.mentalModelScope }
      : {}),
    ...(journeyTopic.objectives ? { objectives: journeyTopic.objectives } : {}),
  });

  return { character };
}
