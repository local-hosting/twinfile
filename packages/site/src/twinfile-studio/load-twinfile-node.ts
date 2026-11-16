import { readFileSync, statSync } from 'node:fs';
import { basename, isAbsolute, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isLocalCopyRef,
} from '@local-hosting/twinfile-place';
import {
  findTwinfileYamlPath,
  twinfileMixinRefs,
  parseManifestPatches,
} from '@local-hosting/twinfile-core';
import { parse } from 'yaml';

import { serializeTwinfileFiles, splitEditorBuffer } from './serialize-twinfile.js';

const SOURCE_REF = /sources\/[A-Za-z0-9_./-]+\.(?:geojson|json|ya?ml)/g;

export type LoadTwinfileDocumentOptions = {
  examplesRoot?: string;
  /** `composed` (default) inlines `with:` mixins; `from:` stays a ref on this unit’s Twinfile.yaml (npm deps). `local` is this dir only. */
  stack?: 'composed' | 'local';
};

/** Paths present in a composed editor buffer (after `loadTwinfileDocument`). */
export function composedTwinfilePaths(text: string): string[] {
  return splitEditorBuffer(text)
    .map((section) => section.path)
    .filter((path) => path !== 'document');
}

/** Read a `twinfile/name:version` ref, a directory unit, or one source file. */
export function loadTwinfileDocument(uri: string, options: LoadTwinfileDocumentOptions = {}): string {
  const trimmed = uri.trim();
  const examplesRoot = examplesRootFrom(options);
  const stack = options.stack ?? 'composed';

  if (trimmed.startsWith('twinfile/') || isBareRef(trimmed)) {
    const ref = trimmed.startsWith('twinfile/') ? trimmed : `twinfile/${trimmed}`;
    return readUnit(resolveRefDir(ref, examplesRoot), examplesRoot, stack);
  }

  const path = trimmed.startsWith('file://') ? fileURLToPath(trimmed) : resolve(trimmed);
  const stat = statSync(path, { throwIfNoEntry: false });
  if (!stat) throw new Error(`loadTwinfileDocument: not found: ${path}`);
  if (stat.isDirectory()) return readUnit(path, examplesRoot, stack);
  if (stat.isFile()) return readFileSync(path, 'utf8');
  throw new Error(`loadTwinfileDocument: not a file: ${path}`);
}

/** This unit's files only — no resolved `from:` / `with:` (like package.json without node_modules). */
export function loadLocalTwinfileDocument(
  uri: string,
  options: Omit<LoadTwinfileDocumentOptions, 'stack'> = {},
): string {
  return loadTwinfileDocument(uri, { ...options, stack: 'local' });
}

/** Unit buffer: optional `from:` / `with:` stack (prefixed), then local files. */
function readUnit(root: string, examplesRoot: string, stack: 'composed' | 'local'): string {
  const files = collectUnitFiles(root, examplesRoot, new Set(), '', stack);
  return serializeTwinfileFiles(files);
}

function collectUnitFiles(
  root: string,
  examplesRoot: string,
  stackRefs: Set<string>,
  pathPrefix = '',
  stack: 'composed' | 'local' = 'composed',
): { path: string; text: string }[] {
  const twinfilePath = findTwinfileYamlPath(root);
  if (!twinfilePath) throw new Error(`loadTwinfileDocument: no Twinfile in ${root}`);
  const manifestName = basename(twinfilePath);
  const manifestText = readRequired(root, manifestName);
  const twinfile = parse(manifestText) as Record<string, unknown>;
  const files: { path: string; text: string }[] = [];
  const seen = new Set<string>();

  const rels = [manifestName, ...stackPathsFromManifest(twinfile)];
  for (const rel of rels) {
    const path = `${pathPrefix}${rel}`;
    if (seen.has(path)) continue;
    seen.add(path);
    files.push({ path, text: readRequired(root, rel) });
  }

  for (const rel of referencedSources(root, files.map((file) => file.text))) {
    const path = `${pathPrefix}${rel}`;
    if (seen.has(path)) continue;
    seen.add(path);
    files.push({ path, text: readRequired(root, rel) });
  }

  if (stack === 'composed') {
    const linked: { path: string; text: string }[] = [];
    for (const mixinRef of twinfileMixinRefs(twinfile)) {
      const ref = mixinRef.trim();
      if (!ref.startsWith('twinfile/') || stackRefs.has(ref)) continue;
      stackRefs.add(ref);
      const mixinRoot = resolveRefDir(ref, examplesRoot);
      linked.push(...collectUnitFiles(mixinRoot, examplesRoot, stackRefs, `with/${ref}/`, 'local'));
    }
    for (const step of parseManifestPatches(twinfile).instructions) {
      if (step.type !== 'copy' || !isLocalCopyRef(step.copy)) continue;
      const rel = step.copy.replace(/^\.\//, '');
      linked.push(...collectUnitFiles(resolve(root, step.copy), examplesRoot, stackRefs, `${pathPrefix}${rel}/`, 'composed'));
    }
    files.push(...linked);
  }

  return files;
}

function referencedSources(root: string, texts: string[]): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(SOURCE_REF)) {
      if (match[0]) found.add(match[0]);
    }
  }
  return [...found].filter((rel) => {
    const abs = resolve(root, rel);
    return isInside(root, abs) && statSync(abs, { throwIfNoEntry: false })?.isFile() === true;
  });
}

function resolveRefDir(ref: string, examplesRoot: string): string {
  const mapPath = join(examplesRoot, 'twin.local.yaml');
  if (statSync(mapPath, { throwIfNoEntry: false })?.isFile()) {
    const doc = parse(readFileSync(mapPath, 'utf8')) as { refs?: Record<string, string> };
    const rel = doc.refs?.[ref];
    if (rel) return resolve(examplesRoot, rel);
  }

  const name = ref.slice('twinfile/'.length).split(':')[0] ?? '';
  for (const bucket of ['places', 'bases', 'mixins', 'situations']) {
    const candidate = join(examplesRoot, bucket, name);
    if (findTwinfileYamlPath(candidate)) return candidate;
  }
  const simulatorRoot = process.env.TF_SIMULATOR_ROOT?.trim();
  if (simulatorRoot) {
    const hazardCandidate = join(simulatorRoot, 'situations', name);
    if (findTwinfileYamlPath(hazardCandidate)) return hazardCandidate;
  }
  throw new Error(`loadTwinfileDocument: unknown ref ${ref}`);
}

function examplesRootFrom(options: LoadTwinfileDocumentOptions): string {
  if (options.examplesRoot) return resolve(options.examplesRoot);
  const fromEnv = process.env.TF_EXAMPLES_ROOT?.trim();
  if (fromEnv) return resolve(fromEnv);

  let dir = process.cwd();
  for (let depth = 0; depth < 12; depth += 1) {
    const catalogPlace = join(dir, 'catalog', 'place', 'examples');
    if (statSync(join(catalogPlace, 'twin.local.yaml'), { throwIfNoEntry: false })?.isFile()) {
      return catalogPlace;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('loadTwinfileDocument: set TF_EXAMPLES_ROOT or pass examplesRoot');
}

function readRequired(root: string, rel: string): string {
  const abs = resolve(root, rel);
  if (!isInside(root, abs)) throw new Error(`loadTwinfileDocument: path escapes unit: ${rel}`);
  if (!statSync(abs, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`loadTwinfileDocument: missing ${rel}`);
  }
  return readFileSync(abs, 'utf8');
}

function isInside(root: string, target: string): boolean {
  const rel = relative(root, target);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function stackPathsFromManifest(twinfile: Record<string, unknown>): string[] {
  const layers = twinfile.layers;
  const out: string[] = [];
  if (Array.isArray(layers)) {
    for (const item of layers) {
      if (typeof item === 'string') out.push(item);
      else if (item && typeof item === 'object' && typeof (item as { path?: string }).path === 'string') {
        out.push((item as { path: string }).path);
      }
    }
  }
  for (const plan of stringList(twinfile.plans)) {
    if (!out.includes(plan)) out.push(plan);
  }
  return out;
}

function isBareRef(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*:\d/.test(value);
}
