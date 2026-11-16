import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import yaml from 'js-yaml';

import type { Character } from '../types/character.js';
import {
  CHARACTER_MENTAL_MODEL_SCOPE_FILE,
  CHARACTER_OBJECTIVES_FILE,
  CHARACTER_SEGMENT_FACET_FILES,
  type CharacterSegmentFacetFileKey,
} from './character-segment-topics.js';

function dumpYaml(value: unknown): string {
  return yaml.dump(value, { lineWidth: 100, noRefs: true, sortKeys: false });
}

function clearYamlFiles(dir: string): void {
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.yml') && !name.endsWith('.yaml')) continue;
    rmSync(join(dir, name), { force: true });
  }
}

function writeYamlFile(dir: string, file: string, value: unknown): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, file), dumpYaml(value));
}

/** Segment slots: single files on the root plus compact rows in `mental-models/` and `journeys/`. */
function saveCharacterSegmentFacets(root: string, character: Character): void {
  for (const [key, file] of Object.entries(CHARACTER_SEGMENT_FACET_FILES) as [CharacterSegmentFacetFileKey, string][]) {
    const value = character[key];
    if (value !== undefined) writeYamlFile(root, file, value);
  }
  if (character.mentalModelScope) {
    writeYamlFile(join(root, 'mental-models'), CHARACTER_MENTAL_MODEL_SCOPE_FILE, character.mentalModelScope);
  }
  if (character.objectives?.length) {
    writeYamlFile(join(root, 'journeys'), CHARACTER_OBJECTIVES_FILE, { objectives: character.objectives });
  }
}

/**
 * Write a Character root in the uniform catalog layout:
 * `character.yml`, segment slot files, and compact `signals/values.yml`
 * when `signalValues` is set. Does not rewrite journeys / mental-models / other topic forests.
 */
export function saveCharacter(root: string, character: Character): void {
  mkdirSync(root, { recursive: true });

  writeFileSync(
    join(root, 'character.yml'),
    dumpYaml({
      ...character.persona,
      id: character.id,
      title: character.title,
      revision: character.revision,
      version: character.version,
      ...(character.summary ? { summary: character.summary } : {}),
    }),
  );
  saveCharacterSegmentFacets(root, character);

  const values = character.signalValues;
  if (values && Object.keys(values).length > 0) {
    const signalsDir = join(root, 'signals');
    mkdirSync(signalsDir, { recursive: true });
    clearYamlFiles(signalsDir);
    writeFileSync(join(signalsDir, 'values.yml'), dumpYaml({ values }));
  }
}
