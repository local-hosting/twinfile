import { statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { isRecord } from '../doc/is-record.js';
import { findTwinfileYamlPath, twinHeadFileName } from './twinfile-locator.js';
import { loadTwinLocalMap, resolveTwinLocalPath, type TwinLocalMap } from '../ref/twin-local-map.js';
import { resolveTwinfileRoot, resolveTypeExamplesRoot, type TwinCatalogType } from '../paths/catalog-layout.js';
import { listFlatExampleUnitNames, flatExampleUnitDir } from '../paths/examples-catalog.js';
import { normalizeComposeTwinfileKeys } from './twinfile-compose.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import { readYamlDocument } from '../validate/validate-yaml.js';

export type LoadedTwinHeadUnit = {
  root: string;
  twinfilePath: string;
  kind: string;
  doc: Record<string, unknown>;
};

export type CatalogUnitResolveOptions = {
  examplesRoot?: string;
  twinLocal?: TwinLocalMap;
};

const CATALOG_TYPES: TwinCatalogType[] = ['place', 'character', 'story', 'resource', 'event'];

function parseTwinfileManifestRef(raw: string): { kind?: string; name: string; tag?: string } | undefined {
  const trimmed = raw.trim();
  const body = trimmed.startsWith('twinfile/') ? trimmed.slice('twinfile/'.length) : trimmed;
  if (!body) return undefined;
  const slash = body.indexOf('/');
  if (slash > 0) {
    const kind = body.slice(0, slash);
    const rest = body.slice(slash + 1);
    const colon = rest.lastIndexOf(':');
    if (colon <= 0) return { kind, name: rest };
    return { kind, name: rest.slice(0, colon), tag: rest.slice(colon + 1) };
  }
  const colon = body.lastIndexOf(':');
  if (colon <= 0) return { name: body };
  return { name: body.slice(0, colon), tag: body.slice(colon + 1) };
}

function versionMatches(manifestVersion: string, refTag: string | undefined): boolean {
  if (!refTag) return true;
  if (manifestVersion === refTag) return true;
  if (/^\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  if (/^\d+\.\d+$/.test(refTag) && manifestVersion.startsWith(`${refTag}.`)) return true;
  return false;
}

function loadHeadAtRoot(root: string): Result<LoadedTwinHeadUnit> {
  const twinfilePath = findTwinfileYamlPath(root);
  if (!twinfilePath) {
    return err([
      {
        code: 'E_MISSING_FILE',
        message: `Missing ${twinHeadFileName(root)}`,
        file: root,
      },
    ]);
  }
  const { value, doc } = readYamlDocument(twinfilePath);
  if (doc.errors.length > 0) {
    return err(doc.errors.map((e) => ({ code: 'E_SCHEMA' as const, message: e.message, file: twinfilePath })));
  }
  if (!isRecord(value)) {
    return err([{ code: 'E_SCHEMA', message: 'expected object', file: twinfilePath }]);
  }
  const twinfile = normalizeComposeTwinfileKeys(value);
  const kind = String(twinfile.kind ?? '').trim();
  if (!kind) {
    return err([{ code: 'E_SCHEMA', message: 'kind is required', file: twinfilePath }]);
  }
  return ok({ root: resolve(root), twinfilePath, kind, doc: twinfile });
}

export function readTwinHeadYaml(unitRoot: string): Result<LoadedTwinHeadUnit> {
  return loadHeadAtRoot(unitRoot);
}

function catalogSearchRoots(
  examplesRoot: string,
  parsed: { kind?: string; name: string },
): string[] {
  const twinRoot = resolve(examplesRoot);
  const types = parsed.kind ? [parsed.kind as TwinCatalogType] : CATALOG_TYPES;
  const roots: string[] = [];
  for (const type of types) {
    if (!CATALOG_TYPES.includes(type)) continue;
    const catalog = resolveTypeExamplesRoot(type, twinRoot);
    roots.push(flatExampleUnitDir(catalog, parsed.name));
  }
  // legacy flat place catalog under examples root
  roots.push(join(resolve(examplesRoot), parsed.name));
  return roots;
}

/** Resolve a typed or flat `twinfile/<type>/<id>:<ver>` ref for any catalog kind. */
export function resolveCatalogUnitRef(
  ref: string,
  options: CatalogUnitResolveOptions,
): Result<LoadedTwinHeadUnit> {
  const parsed = parseTwinfileManifestRef(ref);
  if (!parsed) {
    return err([{ code: 'E_MISSING_FILE', message: `Invalid unit ref: ${ref}` }]);
  }

  const tag = parsed.tag;
  const examplesRoot = options.examplesRoot;

  if (examplesRoot) {
    const localMap = options.twinLocal ?? loadTwinLocalMap(examplesRoot);
    const localPath =
      resolveTwinLocalPath(ref, localMap) ?? resolveTwinLocalPath(`twinfile/${ref.replace(/^twinfile\//, '')}`, localMap);
    if (localPath && statSync(localPath, { throwIfNoEntry: false })?.isDirectory()) {
      const loaded = loadHeadAtRoot(localPath);
      if (loaded.ok && versionMatches(String(loaded.value.doc.version ?? ''), tag)) {
        return loaded;
      }
    }

    for (const root of catalogSearchRoots(examplesRoot, parsed)) {
      if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) continue;
      const loaded = loadHeadAtRoot(root);
      if (!loaded.ok) continue;
      const version = String(loaded.value.doc.version ?? '');
      if (!versionMatches(version, tag)) continue;
      if (parsed.kind && loaded.value.kind !== parsed.kind) continue;
      return loaded;
    }
  }

  return err([
    {
      code: 'E_MISSING_FILE',
      message: `Unit not found for ref ${ref}`,
      hint: examplesRoot ? undefined : 'Set examplesRoot or TF_TWINFILE_ROOT',
    },
  ]);
}

/** List direct child unit folder names for a catalog type (for tooling). */
export function listCatalogExampleUnitNames(examplesRoot: string, type: TwinCatalogType): string[] {
  const catalog = resolveTypeExamplesRoot(type, resolveTwinfileRoot(examplesRoot));
  if (!statSync(catalog, { throwIfNoEntry: false })?.isDirectory()) return [];
  return listFlatExampleUnitNames(catalog);
}