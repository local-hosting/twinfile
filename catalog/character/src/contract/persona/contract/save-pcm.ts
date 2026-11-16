import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import yaml from 'js-yaml';

import type { PCM } from '../types/pcm.js';
import {
  PCM_MENTAL_MODEL_SCOPE_FILE,
  PCM_OBJECTIVES_FILE,
  PCM_SEGMENT_FACET_FILES,
  type PcmSegmentFacetFileKey,
} from './pcm-segment-topics.js';

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
function savePcmSegmentFacets(root: string, pcm: PCM): void {
  for (const [key, file] of Object.entries(PCM_SEGMENT_FACET_FILES) as [PcmSegmentFacetFileKey, string][]) {
    const value = pcm[key];
    if (value !== undefined) writeYamlFile(root, file, value);
  }
  if (pcm.mentalModelScope) {
    writeYamlFile(join(root, 'mental-models'), PCM_MENTAL_MODEL_SCOPE_FILE, pcm.mentalModelScope);
  }
  if (pcm.objectives?.length) {
    writeYamlFile(join(root, 'journeys'), PCM_OBJECTIVES_FILE, { objectives: pcm.objectives });
  }
}

/**
 * Write a PCM root in the uniform catalog layout:
 * `pcm.yml`, `character.yml`, segment slot files, and compact `signals/values.yml`
 * when `signalValues` is set. Does not rewrite journeys / mental-models / other topic forests.
 */
export function savePCM(root: string, pcm: PCM): void {
  mkdirSync(root, { recursive: true });

  writeFileSync(
    join(root, 'pcm.yml'),
    dumpYaml({
      id: pcm.id,
      title: pcm.title,
      revision: pcm.revision,
      version: pcm.version,
      ...(pcm.summary ? { summary: pcm.summary } : {}),
    }),
  );

  writeFileSync(join(root, 'character.yml'), dumpYaml(pcm.persona));
  savePcmSegmentFacets(root, pcm);

  const values = pcm.signalValues;
  if (values && Object.keys(values).length > 0) {
    const signalsDir = join(root, 'signals');
    mkdirSync(signalsDir, { recursive: true });
    clearYamlFiles(signalsDir);
    writeFileSync(join(signalsDir, 'values.yml'), dumpYaml({ values }));
  }
}
