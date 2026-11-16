import { join } from 'node:path';
import { statSync } from 'node:fs';

import { parsePCM } from '../schemas/pcm.schema.js';
import type { PCM } from '../types/pcm.js';
import type { ResearchSignal } from '../types/story/research-signal.js';
import { stripPersonaGroupFields } from './strip-group-fields.js';
import type { Persona } from '../types/strategy/persona.js';
import {
  loadEntityDir,
  loadTopicFolder,
  readYamlFile,
  resolvePcmStrategyTopicRoot,
  resolvePcmSubdir,
  STRATEGY_DIR_CANDIDATES,
} from './io.js';
import { loadPcmStoryTopics } from './load-pcm-story-topics.js';
import {
  loadPcmSegmentFacetFiles,
  partitionPcmJourneyTopic,
  partitionPcmMentalModelTopic,
} from './pcm-segment-topics.js';
import { PCM_STRATEGY_TOPIC_MAP } from './topic-maps.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Split `signals/` topic: full research rows vs compact `{ values: { dimId: number } }`. */
export function partitionPcmSignalTopic(raw: unknown[]): {
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

export type LoadPCMResult = {
  pcm: PCM;
};

function loadPersona(root: string): Persona {
  const characterPath = join(root, 'character.yml');
  if (statSync(characterPath, { throwIfNoEntry: false })?.isFile()) {
    return readYamlFile(characterPath) as Persona;
  }
  const nestedStrategy = resolvePcmSubdir(root, STRATEGY_DIR_CANDIDATES);
  const personasDir = join(nestedStrategy, 'personas');
  const personas = loadEntityDir<Persona>(personasDir);
  if (personas.length === 0) {
    throw new Error(`PCM root ${root} is missing character.yml or strategy/personas/*.yml`);
  }
  if (personas.length > 1) {
    throw new Error(`PCM root ${root} must have exactly one persona (found ${personas.length})`);
  }
  return personas[0];
}

/**
 * Load a PCM root from disk (`pcm.yml` + topic folders on the root).
 * Strategy topics (`needs/`, `mental-models/`, …) and story topics (`journeys/`, `quotes/`)
 * live beside `character.yml`. Nested `strategy/` / `a-strategy/` still resolve as legacy.
 */
export function loadPCM(root: string): LoadPCMResult {
  const pcmYml = join(root, 'pcm.yml');
  if (!statSync(pcmYml, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`PCM root ${root} is missing pcm.yml`);
  }
  const header = readYamlFile(pcmYml) as Record<string, unknown>;
  const persona = stripPersonaGroupFields(loadPersona(root));
  const strategyTopicRoot = resolvePcmStrategyTopicRoot(
    root,
    Object.keys(PCM_STRATEGY_TOPIC_MAP),
  );
  const strategySlice = loadTopicFolder(strategyTopicRoot, PCM_STRATEGY_TOPIC_MAP);
  const storySlice = loadPcmStoryTopics(root);
  const signalTopic = partitionPcmSignalTopic(
    Array.isArray(strategySlice.signals) ? (strategySlice.signals as unknown[]) : [],
  );

  const mentalModelTopic = partitionPcmMentalModelTopic(
    Array.isArray(strategySlice.mentalModels) ? (strategySlice.mentalModels as unknown[]) : [],
  );
  const journeyTopic = partitionPcmJourneyTopic(storySlice.journeys);

  const ownerId = persona.id;
  const mentalModels = mentalModelTopic.mentalModels.map((model) => {
    if (!model || typeof model !== 'object') return model;
    const row = model as Record<string, unknown>;
    const personaIds = row.personaIds;
    if (Array.isArray(personaIds) && personaIds.length > 0) return model;
    return { ...row, personaIds: [ownerId] };
  });

  const pcm = parsePCM({
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
    ...loadPcmSegmentFacetFiles(root),
    ...(mentalModelTopic.mentalModelScope !== undefined
      ? { mentalModelScope: mentalModelTopic.mentalModelScope }
      : {}),
    ...(journeyTopic.objectives ? { objectives: journeyTopic.objectives } : {}),
  });

  return { pcm };
}
