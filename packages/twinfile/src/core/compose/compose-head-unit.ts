import { mergeObjects, type MergeOptions } from '../build/merge.js';
import { isRecord } from '../doc/is-record.js';
import { parseManifestPatches } from '../load/twinfile-instructions.js';
import { resolveCatalogUnitRef, type CatalogUnitResolveOptions } from '../load/load-twin-head-unit.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import { twinfileStepItems } from '../load/twinfile-compose.js';

export type ComposeHeadUnitOptions = CatalogUnitResolveOptions;

const COMPOSE_KEYS = new Set(['from', 'steps', 'patches', 'instructions', 'layers']);

function stripComposeManifestFields(twinfile: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(twinfile)) {
    if (COMPOSE_KEYS.has(key)) continue;
    out[key] = val;
  }
  return out;
}

function applyStepCopy(
  merged: Record<string, unknown>,
  copyRef: string,
  options: ComposeHeadUnitOptions,
  file: string,
): Result<Record<string, unknown>> {
  const trimmed = copyRef.trim();
  if (trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return err([{ code: 'E_BUILD', message: `head copy: local paths not supported yet: ${trimmed}`, file }]);
  }
  const parent = resolveCatalogUnitRef(trimmed, options);
  if (!parent.ok) return parent;
  const childKind = String(merged.kind ?? '');
  if (parent.value.kind !== childKind) {
    return err([
      {
        code: 'E_BUILD',
        message: `head copy: kind mismatch (want ${childKind}, got ${parent.value.kind})`,
        file,
      },
    ]);
  }
  const composedParent = composeHeadUnitDocument(parent.value.doc, parent.value.twinfilePath, options);
  if (!composedParent.ok) return composedParent;
  return ok(mergeObjects(merged, composedParent.value, { mode: 'patch' }) as Record<string, unknown>);
}

function applyInstructions(
  base: Record<string, unknown>,
  rawTwinfile: Record<string, unknown>,
  options: ComposeHeadUnitOptions,
  file: string,
): Result<Record<string, unknown>> {
  let merged = { ...base };
  const items = twinfileStepItems(rawTwinfile);
  const { instructions } = parseManifestPatches(rawTwinfile);
  for (let i = 0; i < instructions.length; i += 1) {
    const step = instructions[i]!;
    if (step.type === 'copy') {
      const item = items[i];
      const copyRef = isRecord(item) && typeof item.copy === 'string' ? item.copy : step.copy;
      const next = applyStepCopy(merged, copyRef, options, file);
      if (!next.ok) return next;
      merged = next.value;
      continue;
    }
    const mode: MergeOptions['mode'] = step.mergeMode === 'replace' ? 'replace' : 'patch';
    merged = mergeObjects(merged, step.doc, { mode }) as Record<string, unknown>;
  }
  return ok(merged);
}

/** Resolve `from:` chain and merge `steps:` for non-place twin heads (character, story, resource, event). */
export function composeHeadUnitDocument(
  twinfile: Record<string, unknown>,
  twinfilePath: string,
  options: ComposeHeadUnitOptions,
): Result<Record<string, unknown>> {
  const kind = String(twinfile.kind ?? '').trim();
  if (!kind) {
    return err([{ code: 'E_SCHEMA', message: 'kind is required', file: twinfilePath }]);
  }

  const from = typeof twinfile.from === 'string' ? twinfile.from.trim() : '';
  let base: Record<string, unknown> = {};

  if (from) {
    const parent = resolveCatalogUnitRef(from, options);
    if (!parent.ok) return parent;
    if (parent.value.kind !== kind) {
      return err([
        {
          code: 'E_BUILD',
          message: `${kind} from must reference same kind (got ${parent.value.kind})`,
          file: twinfilePath,
        },
      ]);
    }
    const composedParent = composeHeadUnitDocument(parent.value.doc, parent.value.twinfilePath, options);
    if (!composedParent.ok) return composedParent;
    base = composedParent.value;
  }

  let merged = mergeObjects(base, stripComposeManifestFields(twinfile)) as Record<string, unknown>;

  if (twinfileStepItems(twinfile).length > 0) {
    const patched = applyInstructions(merged, twinfile, options, twinfilePath);
    if (!patched.ok) return patched;
    merged = patched.value;
  }

  return ok(merged);
}