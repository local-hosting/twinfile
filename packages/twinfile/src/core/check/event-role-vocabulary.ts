import { readFileSync } from 'node:fs';

import { parse as parseYaml } from 'yaml';

import type { ContractError } from '../build/contract-checker.js';
import type { ExpectsRole, PlanRoles, PlaceData } from '../build/contract-checker.js';
import { resolveSpecConfPath } from '../paths/resolve-spec-conf.js';
export type EventRoleVocabularyEntry = {
  id: string;
  kind: string;
  title?: string;
  domain?: string;
};

export type EventRoleVocabulary = Map<string, EventRoleVocabularyEntry>;

let cached: EventRoleVocabulary | undefined;

export function eventRoleVocabularyPath(): string {
  return resolveSpecConfPath('role-vocabulary.yaml');
}

export function loadEventRoleVocabulary(): EventRoleVocabulary {
  if (cached) return cached;
  const raw = readFileSync(eventRoleVocabularyPath(), 'utf8');
  const doc = parseYaml(raw) as { roles?: unknown };
  const roles = doc.roles;
  if (!Array.isArray(roles)) {
    throw new Error('event-role-vocabulary: missing roles array');
  }
  const map: EventRoleVocabulary = new Map();
  for (const row of roles) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const entry = row as Record<string, unknown>;
    const id = String(entry.id ?? '').trim();
    const kind = String(entry.kind ?? '').trim();
    if (!id || !kind) continue;
    if (map.has(id)) {
      throw new Error(`event-role-vocabulary: duplicate id ${id}`);
    }
    map.set(id, {
      id,
      kind,
      ...(typeof entry.title === 'string' ? { title: entry.title } : {}),
      ...(typeof entry.domain === 'string' ? { domain: entry.domain } : {}),
    });
  }
  if (map.size === 0) {
    throw new Error('event-role-vocabulary: empty roles');
  }
  cached = map;
  return map;
}

export function clearEventRoleVocabularyCacheForTests(): void {
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
  vocabulary: EventRoleVocabulary,
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
        message: `Plan role ${key} is not declared on event expects`,
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
  vocabulary: EventRoleVocabulary,
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
