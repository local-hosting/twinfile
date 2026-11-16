import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { parse as parseYaml } from 'yaml';

import {
  isBindingLayerPath,
  twinfileLayerPaths,
  twinfileBindingPaths,
  parseManifestLayerEntries,
} from '../load/twinfile-paths.js';
import { readYamlDocument } from '../validate/validate-yaml.js';
import { resolveExamplesRoot } from '../paths/resolve-examples-root.js';
import { catalogResolveOptions } from '../paths/catalog-resolve-options.js';
import { resolveTwinfileByRef } from '../ref/twinfile-resolver.js';
import { flatTwinfileRef, parseTwinfileRef } from '../types/twinfile-ref.js';
import type { TwinfileRefKind } from '../types/twinfile-ref.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';

export type UpgradedManifest = {
  twinfile: Record<string, unknown>;
  /** Layer and plan files now inlined in `steps:` (relative to the unit root). */
  inlined: string[];
};

const V1_STACK_KEYS = ['layers', 'with', 'buildings', 'plans'] as const;

function readDoc(root: string, rel: string): Record<string, unknown> {
  return parseYaml(readFileSync(join(root, rel), 'utf8')) as Record<string, unknown>;
}

function buildingCopies(twinfile: Record<string, unknown>, file: string): Result<Record<string, unknown>[]> {
  const raw = twinfile.buildings;
  if (!Array.isArray(raw)) return ok([]);
  const out: Record<string, unknown>[] = [];
  for (const entry of raw as Record<string, unknown>[]) {
    if (Array.isArray(entry.floors)) {
      return err([
        {
          code: 'E_SCHEMA',
          message: `buildings[${String(entry.id)}].floors: move floors into the building's own Twinfile (copy: ./floors/<name>)`,
          file,
        },
      ]);
    }
    out.push({
      copy: String(entry.from),
      into: String(entry.id),
      ...(typeof entry.prefix === 'string' ? { prefix: entry.prefix } : {}),
    });
  }
  return ok(out);
}

function typedScenarioCopyRef(
  ref: string,
  twinfilePath: string,
): string {
  const prefixed = ref.trim().startsWith('twinfile/') ? ref.trim() : `twinfile/${ref.trim()}`;
  const normalized = prefixed.replace(/^twinfile\/situation\//, 'twinfile/event/');
  const parsed = parseTwinfileRef(normalized);
  if (parsed?.kind) return normalized;

  const examplesRoot = resolveExamplesRoot(dirname(twinfilePath));
  if (examplesRoot) {
    const resolved = resolveTwinfileByRef(normalized, catalogResolveOptions(examplesRoot));
    if (resolved.ok) {
      const kind = String(resolved.value.loaded.twinfile.kind ?? '') as TwinfileRefKind;
      if (parsed?.name && parsed.tag) {
        return `twinfile/${kind}/${parsed.name}:${parsed.tag}`;
      }
    }
  }

  return flatTwinfileRef(normalized);
}

function upgradeScenarioToSteps(
  twinfilePath: string,
  twinfile: Record<string, unknown>,
): Result<UpgradedManifest> {
  const root = dirname(twinfilePath);
  const inlined: string[] = [];
  const steps: Record<string, unknown>[] = [];
  const include = Array.isArray(twinfile.include) ? (twinfile.include as string[]) : [];
  for (const ref of include) {
    if (typeof ref !== 'string') continue;
    steps.push({ copy: typedScenarioCopyRef(ref, twinfilePath) });
  }
  for (const rel of twinfileLayerPaths(twinfile)) {
    const parsed = readYamlDocument(join(root, rel));
    if (parsed.value && typeof parsed.value === 'object' && !Array.isArray(parsed.value)) {
      steps.push(parsed.value as Record<string, unknown>);
      inlined.push(rel);
    }
  }
  if (steps.length === 0) {
    return err([
      {
        code: 'E_SCHEMA',
        message: 'Scenario upgrade requires include: or layers: to convert into steps',
        file: twinfilePath,
      },
    ]);
  }
  const out: Record<string, unknown> = { ...twinfile, twinfile: 2, steps };
  delete out.include;
  delete out.layers;
  return ok({ twinfile: out, inlined });
}

/** Rewrite a twinfile 1 place manifest as twinfile 2: inline steps, plans, then building copies. */
export function upgradeTwinfileToPatches(
  twinfilePath: string,
  twinfile: Record<string, unknown>,
): Result<UpgradedManifest> {
  if (twinfile.twinfile === 2) return ok({ twinfile, inlined: [] });
  if (twinfile.kind === 'scenario') return upgradeScenarioToSteps(twinfilePath, twinfile);
  if (twinfile.kind !== 'place') return ok({ twinfile, inlined: [] });
  if (twinfile.with !== undefined) {
    return err([
      { code: 'E_SCHEMA', message: 'with: is not supported; put the rows in the place or its base', file: twinfilePath },
    ]);
  }

  const root = dirname(twinfilePath);
  const buildings = buildingCopies(twinfile, twinfilePath);
  if (!buildings.ok) return buildings;

  const inlined: string[] = [];
  const steps: Record<string, unknown>[] = [];

  for (const entry of parseManifestLayerEntries(twinfile)) {
    if (isBindingLayerPath(entry.path)) continue;
    steps.push({ ...readDoc(root, entry.path), ...(entry.mode === 'replace' ? { mode: 'replace' } : {}) });
    inlined.push(entry.path);
  }
  for (const rel of twinfileBindingPaths(twinfile)) {
    steps.push({ bind: readDoc(root, rel) });
    inlined.push(rel);
  }
  steps.push(...buildings.value);

  const out: Record<string, unknown> = { ...twinfile, twinfile: 2, steps };
  for (const key of V1_STACK_KEYS) delete out[key];
  return ok({ twinfile: out, inlined });
}
