import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import {
  buildTwinfile,
} from '@local-hosting/twinfile-place';
import {
  isPatchesTwinfile,
  loadTwinfile,
  resolveExamplesRoot,
  resolveSimulatorRoot,
} from '@local-hosting/twinfile-core';
import type { ExpectsRole, PlaceData } from '@local-hosting/twinfile-core';
import { formatPlaceManifestFile, readTwinfileDoc, upsertStepItem, writeTwinfileDoc } from '@local-hosting/twinfile-core/cli';

import { ensureSimulatorEventCatalog } from '../catalog/bootstrap-simulator-catalog.js';
import { getRegisteredPlaceEvent } from '../catalog/event-catalog.js';
import { placeEventToHead } from '../catalog/place-event-head.js';

export type AddBindToPlaceOptions = {
  examplesRoot?: string;
  force?: boolean;
};

export type AddBindToPlaceResult = {
  /** `bindings/<name>.yaml` for layer units, `steps[i]` for inline steps. */
  location: string;
  roles: Record<string, string[]>;
  warnings: string[];
};

type SituationManifest = {
  kind: string;
  name: string;
  expects?: Record<string, ExpectsRole>;
  phases?: string[];
};

function recordsForKind(place: PlaceData, kind: string): Array<{ id: string; roles?: string[] }> {
  switch (kind) {
    case 'space':
      return (place.spaces ?? []) as Array<{ id: string; roles?: string[] }>;
    case 'opening':
      return (place.openings ?? []) as Array<{ id: string; roles?: string[] }>;
    case 'marker':
      return (place.markers ?? []) as Array<{ id: string; roles?: string[] }>;
    case 'gauge':
      return (place.gauges ?? []) as Array<{ id: string; roles?: string[] }>;
    case 'station':
      return (place.stations ?? []) as Array<{ id: string; roles?: string[] }>;
    default:
      return [];
  }
}

export function collectPlaceIdsForRole(
  place: PlaceData,
  kind: string,
  roleName: string,
): string[] {
  const ids: string[] = [];
  for (const row of recordsForKind(place, kind)) {
    if (!row.id) continue;
    if (Array.isArray(row.roles) && row.roles.includes(roleName)) {
      ids.push(row.id);
    }
  }
  return ids.sort((a, b) => a.localeCompare(b));
}

function loadSituationManifestFromExamples(
  situationName: string,
  examplesRoot: string,
  simulatorRoot?: string,
): SituationManifest {
  const normalized = situationName.trim();
  if (!normalized) {
    throw new Error('situation name is required');
  }
  const catalogRoot =
    simulatorRoot ?? resolveSimulatorRoot(examplesRoot) ?? join(examplesRoot, '..', 'simulator');
  ensureSimulatorEventCatalog(catalogRoot);
  const catalogEvent = getRegisteredPlaceEvent(normalized);
  if (catalogEvent) {
    const raw = placeEventToHead(catalogEvent);
    const expects = raw.expects;
    if (!expects || typeof expects !== 'object' || Array.isArray(expects)) {
      throw new Error(`Situation "${normalized}" missing expects`);
    }
    const phases = Array.isArray(raw.phases)
      ? raw.phases.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
      : [];
    return {
      kind: 'situation',
      name: normalized,
      expects: expects as Record<string, ExpectsRole>,
      phases,
    };
  }

  const roots = [catalogRoot, examplesRoot].filter((r): r is string => typeof r === 'string' && r.length > 0);
  let twinfilePath: string | undefined;
  for (const root of roots) {
    const situationDir = join(resolve(root), 'situations', normalized);
    const candidate = ['Twinfile.yaml', 'twinfile.yaml']
      .map((name) => join(situationDir, name))
      .find((p) => statSync(p, { throwIfNoEntry: false })?.isFile());
    if (!candidate) continue;
    twinfilePath = candidate;
    break;
  }
  if (!twinfilePath) {
    throw new Error(`Unknown place event "${normalized}" (catalog + legacy paths)`);
  }
  const raw = parseYaml(readFileSync(twinfilePath, 'utf8')) as Record<string, unknown>;
  if (raw.kind !== 'situation') {
    throw new Error(`Not a situation manifest: ${twinfilePath}`);
  }
  const refId = String(raw.id ?? raw.name ?? '').trim();
  if (refId !== normalized) {
    throw new Error(`Situation manifest id must match directory (${twinfilePath})`);
  }
  const expects = raw.expects;
  if (!expects || typeof expects !== 'object' || Array.isArray(expects)) {
    throw new Error(`Situation "${normalized}" missing expects`);
  }
  const phases = Array.isArray(raw.phases)
    ? raw.phases.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    : [];
  return {
    kind: 'situation',
    name: normalized,
    expects: expects as Record<string, ExpectsRole>,
    phases,
  };
}

export function buildPlanRolesFromPlace(
  place: PlaceData,
  expects: Record<string, ExpectsRole>,
): { roles: Record<string, string[]>; warnings: string[] } {
  const roles: Record<string, string[]> = {};
  const warnings: string[] = [];
  for (const [roleName, spec] of Object.entries(expects)) {
    const ids = collectPlaceIdsForRole(place, spec.kind, roleName);
    roles[roleName] = ids;
    if (spec.min > 0 && ids.length < spec.min) {
      warnings.push(
        `Role "${roleName}" expects min ${spec.min} ${spec.kind}(s) tagged roles: [${roleName}]; found ${ids.length}. Edit bindings or tag spaces/openings.`,
      );
    }
  }
  return { roles, warnings };
}

/** State each tagged role takes at the situation's action phase (matches example bindings). */
const DEFAULT_ROLE_STATES: Record<string, string> = {
  outdoor: 'restricted',
  shelter: 'open',
  'ground-transport': 'closed',
  'water-launch': 'closed',
  'flood-refuge': 'open',
  'safe-access': 'restricted',
  'collection-point': 'restricted',
  alternative: 'open',
};

function defaultActionPhase(phases: readonly string[]): string | undefined {
  if (phases.length === 0) return undefined;
  const preferred = [
    'warning',
    'disrupted',
    'release',
    'evacuation-order',
    'evacuation',
    'crest',
    'shaking',
    'ashfall',
    'arrival',
    'restriction',
    'outage',
    'active',
  ];
  for (const phase of preferred) {
    if (phases.includes(phase)) return phase;
  }
  return phases[1] ?? phases[0];
}

export function buildPlanDocument(
  situationName: string,
  _expects: Record<string, ExpectsRole>,
  roles: Record<string, string[]>,
  phases: readonly string[],
): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    for: situationName,
    roles: { ...roles },
  };

  const phase = defaultActionPhase(phases);
  const set: Record<string, { state: string }> = {};
  for (const [role, state] of Object.entries(DEFAULT_ROLE_STATES)) {
    for (const id of roles[role] ?? []) set[id] = { state };
  }
  doc.actions = phase && Object.keys(set).length > 0 ? [{ at: phase, set }] : [];

  return doc;
}

function writeBindingPatch(unitDir: string, bindDoc: Record<string, unknown>, force: boolean): string {
  const twinfilePath = join(unitDir, 'Twinfile.yaml');
  const twinfile = readTwinfileDoc(twinfilePath);
  const isSameBinding = (item: Record<string, unknown>) => {
    const doc =
      (item.bind as { for?: unknown } | undefined) ?? (item.plan as { for?: unknown } | undefined);
    return doc?.for === bindDoc.for;
  };
  const index = upsertStepItem(twinfile, { bind: bindDoc }, isSameBinding, force);
  if (index < 0) throw new Error(`Binding for "${String(bindDoc.for)}" already exists in steps: (use --force)`);
  writeTwinfileDoc(twinfilePath, twinfile);
  return `steps[${index}]`;
}

function writeBindingFile(unitDir: string, name: string, bindDoc: Record<string, unknown>, force: boolean): string {
  const bindRelPath = `bindings/${name}.yaml`;
  const bindAbsPath = join(unitDir, bindRelPath);
  if (existsSync(bindAbsPath) && !force) {
    throw new Error(`Binding already exists: ${bindAbsPath} (use --force)`);
  }
  mkdirSync(join(unitDir, 'bindings'), { recursive: true });
  const header = `# Wired by twin add bind — tag spaces/openings with roles: [...] then twin check --strict\n`;
  writeFileSync(bindAbsPath, header + stringifyYaml(bindDoc));
  appendBindingToTwinfile(join(unitDir, 'Twinfile.yaml'), bindRelPath);
  return bindRelPath;
}

function appendBindingToTwinfile(twinfilePath: string, planRelPath: string): void {
  const raw = parseYaml(readFileSync(twinfilePath, 'utf8')) as Record<string, unknown>;
  const layers = Array.isArray(raw.layers) ? [...raw.layers] : [];
  const paths = layers.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (item && typeof item === 'object' && typeof (item as { path?: string }).path === 'string') {
      return [(item as { path: string }).path];
    }
    return [];
  });
  if (!paths.includes(planRelPath)) {
    layers.push(planRelPath);
    raw.layers = layers;
    delete raw.plans;
    delete raw.bindings;
    writeFileSync(twinfilePath, stringifyYaml(raw));
    formatPlaceManifestFile(twinfilePath);
  }
}

export async function addBindToPlace(
  unitDir: string,
  situationName: string,
  options: AddBindToPlaceOptions = {},
): Promise<AddBindToPlaceResult> {
  const examplesRoot = options.examplesRoot ?? resolveExamplesRoot(unitDir);
  if (!examplesRoot) {
    throw new Error('twin add bind requires TF_EXAMPLES_ROOT or --examples-root');
  }

  const loaded = loadTwinfile(unitDir);
  if (!loaded.ok) {
    throw new Error(loaded.errors.map((e) => e.message).join('; '));
  }
  if (loaded.value.twinfile.kind !== 'place') {
    throw new Error('twin add bind requires a place Twinfile');
  }

  const simulatorRoot = resolveSimulatorRoot(examplesRoot) ?? undefined;
  const situation = loadSituationManifestFromExamples(situationName, examplesRoot, simulatorRoot);
  const built = await buildTwinfile(unitDir, {
    examplesRoot,
        writeLock: false,
      });
  if (!built.ok) {
    throw new Error(built.errors.map((e: { message: string }) => e.message).join('; '));
  }

  const place = built.value.data as PlaceData;
  const { roles, warnings } = buildPlanRolesFromPlace(place, situation.expects!);
  const planDoc = buildPlanDocument(
    situation.name,
    situation.expects!,
    roles,
    situation.phases ?? [],
  );

  const force = options.force ?? false;
  const location = isPatchesTwinfile(loaded.value.twinfile)
    ? writeBindingPatch(unitDir, planDoc, force)
    : writeBindingFile(unitDir, situation.name, planDoc, force);
  return { location, roles, warnings };
}

export type AddPlanToPlaceOptions = AddBindToPlaceOptions;
export type AddPlanToPlaceResult = AddBindToPlaceResult;
