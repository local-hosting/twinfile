import { statSync } from 'node:fs';
import { join } from 'node:path';

import type { LoadedTwinfile } from './load-twinfile.js';
import { twinfilePlaceLayerPaths, twinfileBindingPaths } from './twinfile-paths.js';
import { readYamlDocument } from '../validate/validate-yaml.js';
import type { EventBindingDoc, TwinfileInstruction } from '../types/twinfile-instructions.js';
import { twinfileStepItems } from './twinfile-compose.js';
import { isRecord } from '../doc/is-record.js';

/** Units with ordered `steps:` (manifest field `twinfile: 2` per RFC 0009). */
export function isPatchesTwinfile(twinfile: Record<string, unknown>): boolean {
  return twinfile.twinfile === 2;
}

function bindingDocFromStepItem(item: Record<string, unknown>): Record<string, unknown> | undefined {
  if (isRecord(item.bind)) return item.bind;
  if (isRecord(item.plan)) return item.plan;
  return undefined;
}

/** Parse `steps:` into ordered compose steps and event binding documents (no filesystem access). */
export function parseManifestPatches(twinfile: Record<string, unknown>): {
  instructions: TwinfileInstruction[];
  eventBindings: EventBindingDoc[];
} {
  const instructions: TwinfileInstruction[] = [];
  const eventBindings: EventBindingDoc[] = [];
  const items = twinfileStepItems(twinfile);
  items.forEach((item, index) => {
    if (!isRecord(item)) return;
    if (typeof item.copy === 'string') {
      instructions.push({
        type: 'copy',
        ref: `copy/${index}`,
        copy: item.copy.trim(),
        ...(typeof item.into === 'string' ? { into: item.into } : {}),
        ...(typeof item.prefix === 'string' ? { prefix: item.prefix } : {}),
      });
      return;
    }
    const binding = bindingDocFromStepItem(item);
    if (binding) {
      eventBindings.push({ rel: `bind/${String(binding.for ?? index)}`, doc: binding });
      return;
    }
    const { mode, ...doc } = item;
    instructions.push({
      type: 'patch',
      ref: `patch/${index}/${Object.keys(doc).join('+')}`,
      doc,
      mergeMode: mode === 'replace' ? 'replace' : 'patch',
    });
  });
  return { instructions, eventBindings };
}

/** Ordered build steps for a unit: inline `steps:` or v1 `layers:` files. */
export function listTwinfileInstructions(unit: LoadedTwinfile): TwinfileInstruction[] {
  if (isPatchesTwinfile(unit.twinfile)) return parseManifestPatches(unit.twinfile).instructions;
  const out: TwinfileInstruction[] = [];
  for (const entry of twinfilePlaceLayerPaths(unit.twinfile)) {
    const path = join(unit.root, entry.path);
    if (!statSync(path, { throwIfNoEntry: false })?.isFile()) continue;
    const doc = readYamlDocument(path).value;
    out.push({ type: 'patch', ref: entry.path, doc: isRecord(doc) ? doc : {}, mergeMode: entry.mode });
  }
  return out;
}

/** Patch documents only (copies excluded), for row-level inspection. */
export function listTwinfilePatchDocs(unit: LoadedTwinfile): Record<string, unknown>[] {
  return listTwinfileInstructions(unit).flatMap((step) => (step.type === 'patch' ? [step.doc] : []));
}

/**
 * Event bindings a unit declares. v1 binding files are looked up in the unit, then in `fallbackRoots`
 * (higher-precedence units first), matching the inherit stack.
 */
export function listTwinfileEventBindings(
  unit: LoadedTwinfile,
  fallbackRoots: readonly string[] = [],
): EventBindingDoc[] {
  if (isPatchesTwinfile(unit.twinfile)) return parseManifestPatches(unit.twinfile).eventBindings;
  const out: EventBindingDoc[] = [];
  for (const rel of twinfileBindingPaths(unit.twinfile)) {
    const root = [unit.root, ...fallbackRoots].find(
      (dir) => statSync(join(dir, rel), { throwIfNoEntry: false })?.isFile(),
    );
    if (!root) continue;
    const doc = readYamlDocument(join(root, rel)).value;
    if (isRecord(doc)) out.push({ rel, doc });
  }
  return out;
}

