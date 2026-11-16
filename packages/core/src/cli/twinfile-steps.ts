import { readFileSync, writeFileSync } from 'node:fs';

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { twinfileStepItems, setTwinfileStepItems } from '../load/twinfile-compose.js';
import { formatPlaceManifestFile } from './format-twinfile.js';

type StepItem = Record<string, unknown>;

export function readTwinfileDoc(twinfilePath: string): Record<string, unknown> {
  return parseYaml(readFileSync(twinfilePath, 'utf8')) as Record<string, unknown>;
}

export function writeTwinfileDoc(twinfilePath: string, twinfile: Record<string, unknown>): void {
  writeFileSync(twinfilePath, stringifyYaml(twinfile));
  formatPlaceManifestFile(twinfilePath);
}

function stepItems(twinfile: Record<string, unknown>): StepItem[] {
  return twinfileStepItems(twinfile) as StepItem[];
}

/** Replace the first `steps:` item matching `match`, or append; returns its index (`-1` when it exists and `force` is off). */
export function upsertStepItem(
  twinfile: Record<string, unknown>,
  item: StepItem,
  match: (existing: StepItem) => boolean,
  force: boolean,
): number {
  const items = stepItems(twinfile);
  const at = items.findIndex((existing) => existing && typeof existing === 'object' && match(existing));
  if (at >= 0 && !force) return -1;
  const index = at >= 0 ? at : items.length;
  items[index] = item;
  setTwinfileStepItems(twinfile, items);
  return index;
}

/** Add `copy:` steps for refs not already copied, after the leading run of copies (like `with:` mixins). */
export function addLeadingCopies(twinfile: Record<string, unknown>, refs: string[]): void {
  const items = stepItems(twinfile);
  const copied = new Set(items.map((item) => item?.copy).filter((ref) => typeof ref === 'string'));
  const fresh = [...new Set(refs)].filter((ref) => !copied.has(ref)).map((ref) => ({ copy: ref }));
  if (fresh.length === 0) return;
  const lead = items.findIndex((item) => typeof item?.copy !== 'string' || typeof item.into === 'string');
  items.splice(lead < 0 ? items.length : lead, 0, ...fresh);
  setTwinfileStepItems(twinfile, items);
}
