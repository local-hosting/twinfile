import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findTwinfileYamlPath } from '@doppler-group/twinfile-core';

import { parse as parseYaml } from 'yaml';

import { hostPlaceSlugFromCatalogId, type ViewerCatalogEntry } from './viewer-catalog.js';

function inferHostPlaceCatalogId(absPath: string, relKey: string, group: string): string | undefined {
  const norm = absPath.replace(/\\/g, '/');
  const fromPath = norm.match(/\/(?:places|examples)\/([^/]+)/);
  if (fromPath) return fromPath[1];
  if (group === 'sites' && relKey && relKey !== '.') {
    return relKey.split('/')[0];
  }
  return undefined;
}

function hostPlaceFromCatalogParent(twinfile: Record<string, unknown> | undefined): string | undefined {
  if (!twinfile) return undefined;
  const catalog = twinfile.catalog;
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) return undefined;
  const parent = (catalog as { parent?: unknown }).parent;
  if (typeof parent !== 'string') return undefined;
  const m = parent.trim().match(/^twinfile\/([^:@]+)/);
  return m?.[1];
}

function readTwinfileDoc(unitDir: string): Record<string, unknown> | undefined {
  try {
    const manifestFile = findTwinfileYamlPath(unitDir);
    if (!manifestFile) return undefined;
    const doc = parseYaml(readFileSync(manifestFile, 'utf8'));
    return doc && typeof doc === 'object' && !Array.isArray(doc) ? (doc as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/** Scope every catalog row to its host place Twinfile (examples folder slug). */
export function attachHostPlaceCatalogIds(entries: ViewerCatalogEntry[]): void {
  const byId = new Map(entries.map((e) => [e.id, e]));
  for (const entry of entries) {
    const relSlug = hostPlaceSlugFromCatalogId(entry.id);
    const fromPath = inferHostPlaceCatalogId(entry.path, relSlug, entry.group);
    const fromParent = hostPlaceFromCatalogParent(readTwinfileDoc(entry.path));
    if (fromPath) entry.hostPlaceCatalogId = fromPath;
    else if (fromParent) entry.hostPlaceCatalogId = fromParent;
    else if (entry.parent) {
      const parent = byId.get(entry.parent);
      if (parent?.hostPlaceCatalogId) entry.hostPlaceCatalogId = parent.hostPlaceCatalogId;
    } else if (entry.group === 'sites' && entry.kind === 'place' && !entry.parent) {
      entry.hostPlaceCatalogId = entry.id;
    }
  }
}

function readManifestSteps(unitDir: string): unknown[] {
  const doc = readTwinfileDoc(unitDir);
  const steps = doc?.steps;
  return Array.isArray(steps) ? steps : [];
}

function situationSlugFromCopyRef(ref: string): string | undefined {
  const trimmed = ref.trim();
  const m = trimmed.match(/^twinfile\/(?:situation\/)?([^:@]+)/);
  return m?.[1];
}

/** Shared situations: visible under host sites whose runs reference them via `copy:`. */
export function attachSituationHostPlaceScopes(entries: ViewerCatalogEntry[]): void {
  const situationsBySlug = new Map<string, ViewerCatalogEntry[]>();
  for (const entry of entries) {
    if (entry.group !== 'situations') continue;
    const slug = entry.id.split('/').pop();
    if (!slug) continue;
    const rows = situationsBySlug.get(slug) ?? [];
    rows.push(entry);
    situationsBySlug.set(slug, rows);
  }

  for (const entry of entries) {
    if (entry.kind !== 'scenario' || !entry.hostPlaceCatalogId) continue;
    for (const step of readManifestSteps(entry.path)) {
      if (!step || typeof step !== 'object') continue;
      const copy = (step as { copy?: unknown }).copy;
      if (typeof copy !== 'string') continue;
      const slug = situationSlugFromCopyRef(copy);
      if (!slug) continue;
      for (const situation of situationsBySlug.get(slug) ?? []) {
        const hosts = new Set(situation.hostPlaceCatalogIds ?? []);
        hosts.add(entry.hostPlaceCatalogId);
        situation.hostPlaceCatalogIds = [...hosts];
      }
    }
  }
}
