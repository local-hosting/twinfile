import { join } from 'node:path';

import { checkGeotypeTwinfile, isPublishedPlaceTwinfile } from '@local-hosting/twinfile-core';
import { twinHeadPath } from '@local-hosting/twinfile-core';
import {
  checkExpectsAgainstVocabulary,
  checkPlanRolesExact,
  checkPlaceRoleTags,
  checkPlaceRolesInVocabulary,
  loadEventRoleVocabulary,
} from '@local-hosting/twinfile-core';
import { ContractChecker, type ExpectsRole, type PlanRoles, type PlaceData } from '@local-hosting/twinfile-core';
import type { Result, TwinError } from '@local-hosting/twinfile-core';
import { err, ok } from '@local-hosting/twinfile-core';
import { loadTwinfile, type LoadedTwinfile } from '@local-hosting/twinfile-core';
import { listPlaceEventBindings, mergePlaceFromTwinfile } from '../place/place-inherit.js';
import { getDefaultValidator, inlineYamlDocument, validatePlanFile } from '@local-hosting/twinfile-core';
import { resolveTwinfileByRef } from '@local-hosting/twinfile-core';
import { catalogResolveOptions } from '@local-hosting/twinfile-core';

export type StrictCheckOptions = {
  examplesRoot: string;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function mergePlaceDataFromTwinfileAtRoot(
  twinfile: Record<string, unknown>,
  placeRoot: string,
  options?: StrictCheckOptions,
): PlaceData {
  const loaded: LoadedTwinfile = {
    root: placeRoot,
    twinfilePath: twinHeadPath(placeRoot),
    twinfile,
  };
  const merged = mergePlaceFromTwinfile(loaded, options);
  if (!merged.ok) return {};
  return merged.value;
}

function expectsFromEvent(twinfile: Record<string, unknown>): Record<string, ExpectsRole> {
  const expects = twinfile.expects;
  if (!expects || typeof expects !== 'object' || Array.isArray(expects)) return {};
  const out: Record<string, ExpectsRole> = {};
  for (const [name, spec] of Object.entries(expects as Record<string, unknown>)) {
    const row = asRecord(spec);
    if (!row || typeof row.kind !== 'string' || typeof row.min !== 'number') continue;
    out[name] = { kind: row.kind, min: row.min };
  }
  return out;
}

function planRolesFromFile(plan: Record<string, unknown>): PlanRoles {
  const roles = plan.roles;
  if (!roles || typeof roles !== 'object' || Array.isArray(roles)) return {};
  const out: PlanRoles = {};
  for (const [name, ids] of Object.entries(roles as Record<string, unknown>)) {
    if (Array.isArray(ids)) {
      out[name] = ids.filter((x): x is string => typeof x === 'string');
    }
  }
  return out;
}

export function strictCheckPlace(unit: LoadedTwinfile, options: StrictCheckOptions): Result<{ bindings: number }> {
  const twinfile = unit.twinfile;
  if (twinfile.kind !== 'place') {
    return ok({ bindings: 0 });
  }

  const geotypeErr = checkGeotypeTwinfile(twinfile, unit.twinfilePath, {
    published: isPublishedPlaceTwinfile(unit),
  });
  if (geotypeErr) {
    return err([geotypeErr]);
  }

  const bindings = listPlaceEventBindings(unit, options);
  if (!bindings.ok) return bindings;
  if (bindings.value.length === 0) {
    return ok({ bindings: 0 });
  }

  const checker = new ContractChecker();
  const vocabulary = loadEventRoleVocabulary();
  const mergedResult = mergePlaceFromTwinfile(unit, options);
  if (!mergedResult.ok) return mergedResult;
  const merged = mergedResult.value;
  const errors: TwinError[] = [];
  for (const vocabErr of checkPlaceRolesInVocabulary(merged, vocabulary)) {
    errors.push({ code: vocabErr.code, message: vocabErr.message, file: unit.root });
  }
  let checked = 0;

  for (const { rel, doc } of bindings.value) {
    const planPath = rel.startsWith('bind/') || rel.startsWith('plan/') ? unit.twinfilePath : join(unit.root, rel);
    const planValid = validatePlanFile(getDefaultValidator(), inlineYamlDocument(planPath, doc));
    if (!planValid.ok) {
      errors.push(...planValid.errors);
      continue;
    }

    const plan = planValid.value;
    const eventName = String(plan.for ?? '');
    const catalogOpts = catalogResolveOptions(options.examplesRoot);
    const eventRef = `twinfile/event/${eventName}:1.0.0`;
    const eventResolved = resolveTwinfileByRef(eventRef, catalogOpts);
    if (!eventResolved.ok) {
      errors.push({
        code: 'E_MISSING_FILE',
        message: `Place event not found for binding ${rel}: ${eventName}`,
        file: join(options.examplesRoot, 'bindings', rel),
      });
      continue;
    }

    const expects = expectsFromEvent(eventResolved.value.loaded.twinfile);
    const planRoles = planRolesFromFile(plan);
    const missingPlan = checker.checkPlanPresent(planRoles, eventName);
    if (missingPlan) {
      errors.push({ code: 'E_NO_PLAN', message: missingPlan.message, file: planPath });
    }
    for (const contractErr of [
      ...checkExpectsAgainstVocabulary(expects, vocabulary),
      ...checkPlanRolesExact(planRoles, expects),
      ...checker.checkExpects(merged, expects, planRoles),
      ...checkPlaceRoleTags(merged, expects, planRoles),
    ]) {
      errors.push({
        code: contractErr.code,
        message: contractErr.message,
        file: planPath,
      });
    }
    checked += 1;
  }

  if (errors.length > 0) return err(errors);
  return ok({ bindings: checked });
}

export function loadTwinfileStrict(
  unitRoot: string,
  options: StrictCheckOptions,
): Result<LoadedTwinfile & { strictBindings: number }> {
  const base = loadTwinfile(unitRoot);
  if (!base.ok) return base;

  const strict = strictCheckPlace(base.value, options);
  if (!strict.ok) return strict;

  return ok({ ...base.value, strictBindings: strict.value.bindings });
}
