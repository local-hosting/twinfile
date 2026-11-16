import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parse as parseYaml } from 'yaml';

import { findTwinfileYamlPath, twinHeadPath } from '../load/twinfile-locator.js';
import type { TwinError } from '../types/twin-error.js';
import { lockRefKeyFromTwinfile } from '../types/twinfile-lock.js';
import { isTwinfileRef } from '../types/twinfile-ref.js';

function parentSlugFromRef(ref: string): string | undefined {
  const trimmed = ref.trim();
  const match = /^twinfile\/([^:]+):/.exec(trimmed);
  return match?.[1];
}

function loadParentManifest(unitRoot: string, from: unknown): Record<string, unknown> | undefined {
  if (from !== '..') return undefined;
  const parentRoot = resolve(unitRoot, '..');
  const path = findTwinfileYamlPath(parentRoot);
  if (!path) return undefined;
  return parseYaml(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

/** Semantic checks for optional `catalog.parent` on scenario and event units. */
export function checkCatalogParent(unitRoot: string, twinfile: Record<string, unknown>): TwinError[] {
  const catalog = twinfile.catalog as { parent?: string } | undefined;
  const parentRef = typeof catalog?.parent === 'string' ? catalog.parent.trim() : '';
  if (!parentRef) return [];

  const twinfilePath = twinHeadPath(resolve(unitRoot));
  if (!isTwinfileRef(parentRef)) {
    return [
      {
        code: 'E_CATALOG',
        message: 'catalog.parent must be a twinfile or oci ref',
        file: twinfilePath,
      },
    ];
  }

  const kind = String(twinfile.kind ?? '');
  if (kind !== 'scenario' && kind !== 'event') {
    return [
      {
        code: 'E_CATALOG',
        message: 'catalog.parent is only defined for scenario and event units',
        file: twinfilePath,
      },
    ];
  }

  const id = String(twinfile.id ?? '');
  const parentSlug = parentSlugFromRef(parentRef);
  if (parentSlug && !id.startsWith(`${parentSlug}-`)) {
    return [
      {
        code: 'E_CATALOG',
        message: `manifest id should use prefix "${parentSlug}-" when catalog.parent is ${parentRef}`,
        file: twinfilePath,
      },
    ];
  }

  const parentManifest = loadParentManifest(unitRoot, twinfile.from);
  if (parentManifest) {
    const parentKind = String(parentManifest.kind ?? '');
    if (parentKind !== 'place') {
      return [
        {
          code: 'E_CATALOG',
          message: 'catalog.parent via from: .. must resolve to kind: place',
          file: twinfilePath,
        },
      ];
    }
    const expected = lockRefKeyFromTwinfile(parentManifest);
    if (expected !== parentRef) {
      return [
        {
          code: 'E_CATALOG',
          message: `catalog.parent ${parentRef} does not match host place ref ${expected}`,
          file: twinfilePath,
        },
      ];
    }
  }

  return [];
}
