import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { readYamlDocument } from '../validate/validate-yaml.js';
import type { PlaceRunPreset } from '../types/place-run-preset.js';
import type { LoadedTwinfile } from './load-twinfile.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';

import { RUN_PRESET_NAMES } from '../types/twin-kind.js';

function findPresetPath(root: string): string | undefined {
  for (const name of RUN_PRESET_NAMES) {
    const path = join(root, name);
    if (existsSync(path)) return path;
  }
  return undefined;
}

export function readPlaceRunPresetFile(path: string): Result<PlaceRunPreset> {
  const parsed = readYamlDocument(path);
  const doc = parsed.value;
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return err([{ code: 'E_SCHEMA', message: 'preset must be a YAML mapping', file: path }]);
  }
  const record = doc as Record<string, unknown>;
  const id = record.id;
  if (typeof id !== 'string' || !id.trim()) {
    return err([{ code: 'E_SCHEMA', message: 'preset requires string id', file: path }]);
  }
  return ok(record as PlaceRunPreset);
}

/** Compose-time head for `composeScenarioLayers` — not a Twinfile (no `kind`). */
export function runPresetComposeHead(preset: PlaceRunPreset): Record<string, unknown> {
  return {
    twinfile: 2,
    kind: 'scenario',
    id: preset.id,
    ...(preset.name ? { name: preset.name } : {}),
    version: preset.version ?? '1.0.0',
    ...(preset.stability ? { stability: preset.stability } : {}),
    ...(preset.from ? { from: preset.from } : {}),
    ...(preset.steps ? { steps: preset.steps } : {}),
    ...(preset.role ? { role: preset.role } : { role: 'run' }),
    ...(preset.domains ? { domains: [...preset.domains] } : {}),
    ...(preset.args ? { args: { ...preset.args } } : {}),
    ...(preset.schedule ? { schedule: { ...preset.schedule } } : {}),
    ...(preset.clock ? { clock: { ...preset.clock } } : {}),
    ...(preset.use ? { use: { ...preset.use } } : {}),
    ...(preset.catalog ? { catalog: { ...preset.catalog } } : {}),
    ...(preset.layers ? { layers: [...preset.layers] } : {}),
  };
}

/** Load a scene run directory (`run.yaml`). */
export function loadRunUnit(root: string): Result<LoadedTwinfile> {
  const dir = resolve(root);
  const presetPath = findPresetPath(dir);
  if (!presetPath) {
    return err([{ code: 'E_MISSING_FILE', message: 'Run unit requires run.yaml', file: dir }]);
  }
  const preset = readPlaceRunPresetFile(presetPath);
  if (!preset.ok) return preset;
  return ok({ root: dir, twinfilePath: presetPath, twinfile: runPresetComposeHead(preset.value) });
}
