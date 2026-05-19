import type { PlaceArchetypeAxes, PlaceAxes } from '@local-hosting/geotypes';

import type { LoadedTwinfile } from '@local-hosting/twinfile-core';
import { twinfileMixinRefs, twinfileBindingPaths } from '@local-hosting/twinfile-core';
import { listTwinfileInstructions, listTwinfilePatchDocs } from '@local-hosting/twinfile-core';
import { resolveTwinfileByRef, type TwinfileResolveOptions } from '@local-hosting/twinfile-core';
import type { Result, TwinError, TwinErrorCode } from '@local-hosting/twinfile-core';
import { err, ok } from '@local-hosting/twinfile-core';

type AxisName = keyof PlaceAxes;

const AXIS_NAMES: readonly AxisName[] = ['extent', 'vertical', 'movement'];

/** Declared `axes:` on a place or mixin twinfile. */
export function twinfileAxes(twinfile: Record<string, unknown>): Partial<PlaceAxes> {
  const raw = twinfile.axes;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const name of AXIS_NAMES) {
    const value = (raw as Record<string, unknown>)[name];
    if (typeof value === 'string') out[name] = value;
  }
  return out as Partial<PlaceAxes>;
}

function mixinError(code: TwinErrorCode, message: string, file: string): Result<never> {
  return err([{ code, message, file }]);
}

function getMixinUnit(ref: string, owner: LoadedTwinfile, options: TwinfileResolveOptions): Result<LoadedTwinfile> {
  const resolved = resolveTwinfileByRef(ref, options);
  if (!resolved.ok) return resolved;
  const mixin = resolved.value.loaded;
  if (mixin.twinfile.kind !== 'mixin') {
    return mixinError('E_BUILD', `with must reference mixin units: ${ref} is ${String(mixin.twinfile.kind)}`, owner.twinfilePath);
  }
  for (const step of listTwinfileInstructions(mixin)) {
    if (step.type === 'patch' && 'place' in step.doc) {
      return mixinError('E_MIXIN', `Mixin ${ref} must not patch place (${step.ref})`, mixin.twinfilePath);
    }
  }
  return ok(mixin);
}

/** Row keys (`collection/id`) defined by a unit's patches. */
function getRowKeys(unit: LoadedTwinfile): Set<string> {
  const keys = new Set<string>();
  for (const doc of listTwinfilePatchDocs(unit)) {
    for (const [collection, rows] of Object.entries(doc)) {
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        const id = (row as Record<string, unknown> | null)?.id;
        if (typeof id === 'string') keys.add(`${collection}/${id}`);
      }
    }
  }
  return keys;
}

/** Two mixins in one `with:` list may not define the same axis, row id, or plan file (the owner may resolve rows and plans). */
export function checkMixinConflicts(owner: LoadedTwinfile, mixins: LoadedTwinfile[]): TwinError[] {
  const ownerKeys = new Set([...getRowKeys(owner), ...twinfileBindingPaths(owner.twinfile)]);
  const seen = new Map<string, string>();
  const axes = new Map<AxisName, { value: string; name: string }>();
  const errors: TwinError[] = [];
  const conflict = (message: string) => errors.push({ code: 'E_MIXIN_CONFLICT', message, file: owner.twinfilePath });

  for (const mixin of mixins) {
    const name = String(mixin.twinfile.id);
    for (const [axis, value] of Object.entries(twinfileAxes(mixin.twinfile)) as Array<[AxisName, string]>) {
      const prev = axes.get(axis);
      if (prev && prev.value !== value) conflict(`Mixins ${prev.name} and ${name} set ${axis} to ${prev.value} and ${value}`);
      axes.set(axis, { value, name });
    }
    for (const key of [...getRowKeys(mixin), ...twinfileBindingPaths(mixin.twinfile)]) {
      const prev = seen.get(key);
      if (prev && !ownerKeys.has(key)) conflict(`Mixins ${prev} and ${name} both define ${key}`);
      seen.set(key, name);
    }
  }
  return errors;
}

/** Resolve and validate an owner's `with:` mixins, in list order. */
export function getMixinUnits(owner: LoadedTwinfile, options: TwinfileResolveOptions | undefined): Result<LoadedTwinfile[]> {
  const refs = twinfileMixinRefs(owner.twinfile);
  if (refs.length === 0) return ok([]);
  if (!options?.examplesRoot) {
    return mixinError('E_BUILD', 'Place with requires examplesRoot (or run from a linked examples tree)', owner.twinfilePath);
  }
  const mixins: LoadedTwinfile[] = [];
  for (const ref of refs) {
    const mixin = getMixinUnit(ref.trim(), owner, options);
    if (!mixin.ok) return mixin;
    mixins.push(mixin.value);
  }
  const conflicts = checkMixinConflicts(owner, mixins);
  return conflicts.length > 0 ? err(conflicts) : ok(mixins);
}

/** Mixin `applies_to:` against the composed axes (`any` matches every value). */
export function checkMixinAppliesTo(
  mixins: LoadedTwinfile[],
  axes: PlaceArchetypeAxes | undefined,
  file: string,
): TwinError[] {
  const errors: TwinError[] = [];
  for (const mixin of mixins) {
    const filter = mixin.twinfile.applies_to as Partial<Record<AxisName, string[]>> | undefined;
    if (!filter) continue;
    const name = String(mixin.twinfile.id);
    if (!axes) {
      errors.push({ code: 'E_MIXIN_AXES', message: `Mixin ${name} has applies_to but the place has no archetype`, file });
      continue;
    }
    for (const axis of AXIS_NAMES) {
      const allowed = filter[axis];
      const value = axes[axis];
      if (!allowed || value === 'any' || allowed.includes(value)) continue;
      errors.push({
        code: 'E_MIXIN_AXES',
        message: `Mixin ${name} applies to ${axis} ${allowed.join('|')}; place is ${value}`,
        file,
      });
    }
  }
  return errors;
}
