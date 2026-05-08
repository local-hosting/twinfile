import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';

import type { ContractError } from '../build/contract-checker.js';
import type { ExpectsRole, PlanRoles, PlaceData } from '../build/contract-checker.js';
export type SituationRoleVocabularyEntry = {
  id: string;
  kind: string;
  title?: string;
  domain?: string;
};

export type SituationRoleVocabulary = Map<string, SituationRoleVocabularyEntry>;

const require = createRequire(import.meta.url);

let cached: SituationRoleVocabulary | undefined;

export function situationRoleVocabularyPath(): string {
  const fromPkg = join(
    dirname(require.resolve('@local-hosting/twinfile/package.json')),
    'conf',
    'role-vocabulary.yaml',
  );
  if (statSync(fromPkg, { throwIfNoEntry: false })?.isFile()) {
    return fromPkg;
  }
  const monorepo = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'spec',
    'conf',
    'role-vocabulary.yaml',
  );
  if (statSync(monorepo, { throwIfNoEntry: false })?.isFile()) {
    return monorepo;
  }
  return fromPkg;
}

export function loadSituationRoleVocabulary(): SituationRoleVocabulary {
  if (cached) return cached;
  const raw = readFileSync(situationRoleVocabularyPath(), 'utf8');
  const doc = parseYaml(raw) as { roles?: unknown };
  const roles = doc.roles;
  if (!Array.isArray(roles)) {
    throw new Error('situation-role-vocabulary: missing roles array');
  }
  const map: SituationRoleVocabulary = new Map();
  for (const row of roles) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const entry = row as Record<string, unknown>;
    const id = String(entry.id ?? '').trim();
    const kind = String(entry.kind ?? '').trim();
    if (!id || !kind) continue;
    if (map.has(id)) {
      throw new Error(`situation-role-vocabulary: duplicate id ${id}`);
    }
    map.set(id, {
      id,
      kind,
      ...(typeof entry.title === 'string' ? { title: entry.title } : {}),
      ...(typeof entry.domain === 'string' ? { domain: entry.domain } : {}),
    });
  }
  if (map.size === 0) {
    throw new Error('situation-role-vocabulary: empty roles');
  }
  cached = map;
  return map;
}

export function clearSituationRoleVocabularyCacheForTests(): void {
  cached = undefined;
}

function recordsForKind(place: PlaceData, kind: string) {
  switch (kind) {
    case 'space':
      return place.spaces ?? [];
    case 'opening':
      return place.openings ?? [];
    case 'marker':
      return place.markers ?? [];
    case 'gauge':
      return place.gauges ?? [];
    case 'station':
      return place.stations ?? [];
    default:
      return [];
  }
}

const TAGGED_COLLECTIONS: (keyof PlaceData)[] = [
  'spaces',
  'openings',
  'markers',
  'gauges',
  'stations',
];

export function checkExpectsAgainstVocabulary(
  expects: Record<string, ExpectsRole>,
  vocabulary: SituationRoleVocabulary,
): ContractError[] {
  const errors: ContractError[] = [];
  for (const [roleName, spec] of Object.entries(expects)) {
    const entry = vocabulary.get(roleName);
    if (!entry) {
      errors.push({
        code: 'E_ROLE_VOCAB',
        message: `Role ${roleName} is not in role-vocabulary`,
      });
      continue;
    }
    if (entry.kind !== spec.kind) {
      errors.push({
        code: 'E_ROLE_KIND',
        message: `Role ${roleName} vocabulary kind ${entry.kind} != expects kind ${spec.kind}`,
      });
    }
  }
  return errors;
}

export function checkPlanRolesExact(
  planRoles: PlanRoles,
  expects: Record<string, ExpectsRole>,
): ContractError[] {
  const errors: ContractError[] = [];
  const expectKeys = new Set(Object.keys(expects));
  for (const key of Object.keys(planRoles)) {
    if (!expectKeys.has(key)) {
      errors.push({
        code: 'E_ROLE_VOCAB',
        message: `Plan role ${key} is not declared on situation expects`,
      });
    }
  }
  return errors;
}

export function checkPlaceRoleTags(
  place: PlaceData,
  expects: Record<string, ExpectsRole>,
  planRoles: PlanRoles,
): ContractError[] {
  const errors: ContractError[] = [];
  for (const [roleName, spec] of Object.entries(expects)) {
    const ids = planRoles[roleName];
    if (!ids?.length) continue;
    const pool = recordsForKind(place, spec.kind);
    for (const id of ids) {
      const row = pool.find((r) => r.id === id);
      if (!row) continue;
      if (!Array.isArray(row.roles) || !row.roles.includes(roleName)) {
        errors.push({
          code: 'E_ROLE_TAG',
          message: `${spec.kind} ${id} must include roles: [${roleName}]`,
        });
      }
    }
  }
  return errors;
}

export function checkPlaceRolesInVocabulary(
  place: PlaceData,
  vocabulary: SituationRoleVocabulary,
): ContractError[] {
  const errors: ContractError[] = [];
  for (const collection of TAGGED_COLLECTIONS) {
    const rows = place[collection];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!row?.id || !Array.isArray(row.roles)) continue;
      for (const tag of row.roles) {
        if (typeof tag !== 'string') continue;
        if (!vocabulary.has(tag)) {
          errors.push({
            code: 'E_ROLE_VOCAB',
            message: `${String(collection)} ${row.id} uses unknown role tag ${tag}`,
          });
        }
      }
    }
  }
  return errors;
}
