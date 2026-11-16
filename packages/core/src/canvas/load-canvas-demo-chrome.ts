import { statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isRecord } from '../doc/is-record.js';
import { findTwinfileYamlPath } from '../load/twinfile-locator.js';
import { flatExampleUnitDir } from '../paths/examples-catalog.js';
import {
  catalogHubDir,
  resolveTwinfileRoot,
  resolveTypeExamplesRoot,
  type TwinCatalogType,
} from '../paths/catalog-layout.js';
import type {
  CanvasDemoCharacterRow,
  CanvasDemoEventRow,
  CanvasDemoPackManifest,
  CanvasDemoPlaceRow,
  CanvasDemoProjectContent,
  CanvasDemoResourceRow,
  CanvasDemoStoryRow,
} from '../types/canvas-demo-chrome.js';
import { readYamlDocument } from '../validate/validate-yaml.js';

const PACK_ID = 'canvas-demo';

function twinfileUnitIdFromHref(href: string): { kind: TwinCatalogType; id: string } | undefined {
  const match = /^twinfile\/(place|resource|character|story|event)\/([^:]+):/.exec(href.trim());
  if (!match) return undefined;
  return { kind: match[1] as TwinCatalogType, id: match[2]! };
}

function formatGeo(lat: number, lon: number): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function numberField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function placeGeoFromTwinfile(twinfile: Record<string, unknown>): string {
  const steps = twinfile.steps;
  if (!Array.isArray(steps)) return '';
  for (const step of steps) {
    if (!isRecord(step) || !isRecord(step.place)) continue;
    const ext = step.place.ext;
    if (isRecord(ext)) {
      const lat = numberField(ext.lat);
      const lon = numberField(ext.lon);
      if (lat !== undefined && lon !== undefined) return formatGeo(lat, lon);
    }
    const location = step.place.location;
    if (isRecord(location)) {
      const lat = numberField(location.lat);
      const lon = numberField(location.lng ?? location.lon);
      if (lat !== undefined && lon !== undefined) return formatGeo(lat, lon);
    }
  }
  return '';
}

function resourceGeoFromTwinfile(twinfile: Record<string, unknown>): string {
  const resource = twinfile.resource;
  if (!isRecord(resource)) return '';
  const ext = resource.ext;
  if (!isRecord(ext)) return '';
  const lat = numberField(ext.lat);
  const lon = numberField(ext.lon);
  if (lat === undefined || lon === undefined) return '';
  return formatGeo(lat, lon);
}

function eventDayIndexFromTwinfile(twinfile: Record<string, unknown>): string {
  const canvas = twinfile.canvas;
  if (!isRecord(canvas)) return '';
  return stringField(canvas.dayIndex);
}

function linkedIds(twinfile: Record<string, unknown>, kind: TwinCatalogType): string[] {
  const links = twinfile.links;
  if (!Array.isArray(links)) return [];
  const ids: string[] = [];
  for (const link of links) {
    if (!isRecord(link)) continue;
    const href = stringField(link.href);
    const parsed = twinfileUnitIdFromHref(href);
    if (parsed?.kind === kind) ids.push(parsed.id);
  }
  return ids;
}

function storyPitchFromTwinfile(twinfile: Record<string, unknown>): string {
  const story = twinfile.story;
  if (!isRecord(story)) return '';
  return stringField(story.pitch);
}

function displayName(twinfile: Record<string, unknown>, fallbackId: string): string {
  const name = stringField(twinfile.name);
  return name || fallbackId.replace(/-/g, ' ');
}

function unitDir(root: string, type: TwinCatalogType, id: string): string {
  return flatExampleUnitDir(resolveTypeExamplesRoot(type, root), id);
}

export function resolveCanvasDemoPackPath(root?: string): string {
  return join(catalogHubDir(root ?? resolveTwinfileRoot()), 'conf', `${PACK_ID}.yaml`);
}

export function loadCanvasDemoPack(root?: string): CanvasDemoPackManifest {
  const path = resolveCanvasDemoPackPath(root);
  if (!statSync(path, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`canvas demo pack not found: ${path}`);
  }
  const doc = readYamlDocument(path);
  if (!isRecord(doc.value)) {
    throw new Error(`invalid canvas demo pack: ${path}`);
  }
  const value = doc.value;
  const requireIds = (key: keyof CanvasDemoPackManifest): string[] => {
    const list = value[key as string];
    if (!Array.isArray(list) || list.some((item) => typeof item !== 'string')) {
      throw new Error(`canvas demo pack ${String(key)} must be a string list`);
    }
    return [...list];
  };
  const storyEventIdsRaw = value.storyEventIds;
  const storyEventIds: Record<string, string[]> = {};
  if (isRecord(storyEventIdsRaw)) {
    for (const [storyId, eventIds] of Object.entries(storyEventIdsRaw)) {
      if (!Array.isArray(eventIds) || eventIds.some((item) => typeof item !== 'string')) continue;
      storyEventIds[storyId] = [...eventIds];
    }
  }
  return {
    twinfile: 1,
    id: stringField(value.id) || PACK_ID,
    description: stringField(value.description) || undefined,
    places: requireIds('places'),
    characters: requireIds('characters'),
    resources: requireIds('resources'),
    stories: requireIds('stories'),
    events: requireIds('events'),
    storyEventIds,
  };
}

function loadUnitTwinfile(root: string, type: TwinCatalogType, id: string): Record<string, unknown> {
  const dir = unitDir(root, type, id);
  const twinfilePath = findTwinfileYamlPath(dir);
  if (!twinfilePath) {
    throw new Error(`missing twin head for ${type}/${id}`);
  }
  const parsed = readYamlDocument(twinfilePath);
  if (!isRecord(parsed.value)) {
    throw new Error(`invalid twin head for ${type}/${id}`);
  }
  if (parsed.value.kind !== type) {
    throw new Error(`expected kind ${type} for ${id}, got ${String(parsed.value.kind)}`);
  }
  return parsed.value;
}

function projectPlace(root: string, id: string): CanvasDemoPlaceRow {
  const twinfile = loadUnitTwinfile(root, 'place', id);
  const label = displayName(twinfile, id);
  return {
    id,
    cardTitle: label,
    label,
    slug: id,
    orgVenueId: '',
    geo: placeGeoFromTwinfile(twinfile),
  };
}

function projectCharacter(root: string, id: string): CanvasDemoCharacterRow {
  const twinfile = loadUnitTwinfile(root, 'character', id);
  const label = displayName(twinfile, id);
  return { id, cardTitle: label, label };
}

function projectResource(root: string, id: string): CanvasDemoResourceRow {
  const twinfile = loadUnitTwinfile(root, 'resource', id);
  const label = displayName(twinfile, id);
  return {
    id,
    cardTitle: label,
    label,
    orgInventoryId: '',
    orgVehicleId: '',
    geo: resourceGeoFromTwinfile(twinfile),
  };
}

function projectStory(root: string, id: string): CanvasDemoStoryRow {
  const twinfile = loadUnitTwinfile(root, 'story', id);
  const title = displayName(twinfile, id);
  const personaId = linkedIds(twinfile, 'character')[0] ?? '';
  const mapSlug = linkedIds(twinfile, 'place')[0] ?? id;
  return {
    id,
    cardTitle: title,
    title,
    personaId,
    orgStoryboardId: '',
    mapSlug,
    storyPitch: storyPitchFromTwinfile(twinfile),
  };
}

function projectEvent(root: string, id: string): CanvasDemoEventRow {
  const twinfile = loadUnitTwinfile(root, 'event', id);
  const label = displayName(twinfile, id);
  return {
    id,
    cardTitle: label,
    label,
    dayIndex: eventDayIndexFromTwinfile(twinfile),
  };
}

export function loadCanvasDemoChrome(root?: string): CanvasDemoProjectContent {
  const base = root ?? resolveTwinfileRoot();
  const pack = loadCanvasDemoPack(base);
  return {
    places: pack.places.map((id) => projectPlace(base, id)),
    characters: pack.characters.map((id) => projectCharacter(base, id)),
    stories: pack.stories.map((id) => projectStory(base, id)),
    resources: pack.resources.map((id) => projectResource(base, id)),
    events: pack.events.map((id) => projectEvent(base, id)),
    storyEventIds: pack.storyEventIds,
  };
}

export function writeCanvasDemoChromeJson(outPath: string, root?: string): void {
  const content = loadCanvasDemoChrome(root);
  writeFileSync(outPath, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
}