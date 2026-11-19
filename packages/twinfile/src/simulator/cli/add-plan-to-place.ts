import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { buildTwinfile } from '@local-hosting/twinfile/place';
import {
  isPatchesTwinfile,
  loadTwinfile,
  planRolesFromPlace,
  twinHeadPath,
  resolveExamplesRoot,
} from '@local-hosting/twinfile';
import type { PlaceData } from '@local-hosting/twinfile';
import { formatPlaceManifestFile, readTwinfileDoc, upsertStepItem, writeTwinfileDoc } from '@local-hosting/twinfile/cli';

import { getRegisteredPlaceEvent } from '../catalog/event-catalog.js';
import type { PlaceEvent } from '../types/place-event.js';

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

function getCatalogEvent(eventName: string): PlaceEvent & { expects: NonNullable<PlaceEvent['expects']> } {
  const id = eventName.trim();
  if (!id) throw new Error('event name is required');
  const event = getRegisteredPlaceEvent(id);
  if (!event) throw new Error(`Unknown event "${id}" (catalog/event/examples)`);
  if (!event.expects) throw new Error(`Event "${id}" missing expects`);
  return event as PlaceEvent & { expects: NonNullable<PlaceEvent['expects']> };
}

/** Binding doc that pins the place features filling each of the event's roles. */
export function buildBindingDocument(eventName: string, roles: Record<string, string[]>): Record<string, unknown> {
  return { for: eventName, roles: { ...roles } };
}

function writeBindingPatch(unitDir: string, bindDoc: Record<string, unknown>, force: boolean): string {
  const twinfilePath = twinHeadPath(unitDir);
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
  appendBindingToTwinfile(twinHeadPath(unitDir), bindRelPath);
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
  eventName: string,
  options: AddBindToPlaceOptions = {},
): Promise<AddBindToPlaceResult> {
  const examplesRoot = options.examplesRoot ?? resolveExamplesRoot(unitDir);
  if (!examplesRoot) {
    throw new Error('twin add bind requires TF_TWINFILE_ROOT or --examples-root');
  }

  const loaded = loadTwinfile(unitDir);
  if (!loaded.ok) {
    throw new Error(loaded.errors.map((e) => e.message).join('; '));
  }
  if (loaded.value.twinfile.kind !== 'place') {
    throw new Error('twin add bind requires a place Twinfile');
  }

  const event = getCatalogEvent(eventName);
  const built = await buildTwinfile(unitDir, { examplesRoot, writeLock: false });
  if (!built.ok) {
    throw new Error(built.errors.map((e: { message: string }) => e.message).join('; '));
  }

  const place = built.value.data as PlaceData;
  const { roles, warnings } = planRolesFromPlace(place, event.expects);
  const bindDoc = buildBindingDocument(event.id, roles);

  const force = options.force ?? false;
  const location = isPatchesTwinfile(loaded.value.twinfile)
    ? writeBindingPatch(unitDir, bindDoc, force)
    : writeBindingFile(unitDir, event.id, bindDoc, force);
  return { location, roles, warnings };
}

export type AddPlanToPlaceOptions = AddBindToPlaceOptions;
export type AddPlanToPlaceResult = AddBindToPlaceResult;
