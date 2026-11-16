import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { twinHeadPath } from '../src/load/twinfile-locator.js';
import { findTwinHead, parseTwinHead } from '../src/twinfile/twin-head.js';
import { createHeadTwinTypeModule } from '../src/twinfile/twin-type-module.js';
import { createTwinTypeRegistry } from '../src/twinfile/twin-type-registry.js';

const RESOURCE_HEAD = `twinfile: 2
kind: resource
id: kiosk
name: Kiosk
links:
  - rel: locatedIn
    href: twinfile/place/shop:0.2.0
`;

function unitDir(head?: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'twin-type-'));
  if (head !== undefined) writeFileSync(twinHeadPath(dir), head);
  return dir;
}

describe('parseTwinHead', () => {
  const opts = { headFile: 'kiosk.twin.yaml', kinds: ['resource'] };

  it('accepts the shared head fields', () => {
    const head = parseTwinHead({ kind: 'resource', id: 'kiosk', name: 'Kiosk', links: [] }, opts);
    expect(head.ok && head.value.id).toBe('kiosk');
  });

  it('reports every common-field problem at once', () => {
    const head = parseTwinHead({ kind: 'story', name: 3, links: 'x' }, opts);
    expect(head.ok).toBe(false);
    if (head.ok) return;
    expect(head.errors.map((error) => error.message)).toEqual([
      'kind must be resource',
      'id is required',
      'name must be a string',
      'links must be a list',
    ]);
  });

  it('rejects non-objects', () => {
    expect(parseTwinHead([], opts).ok).toBe(false);
  });
});

describe('findTwinHead', () => {
  it('types the folder-named head by its kind', () => {
    expect(findTwinHead(unitDir(RESOURCE_HEAD))?.kind).toBe('resource');
    expect(findTwinHead(unitDir('kind: mixin\n'))?.kind).toBe('place');
    expect(findTwinHead(unitDir('kind: unknown\n'))).toBeUndefined();
    expect(findTwinHead(unitDir())).toBeUndefined();
  });
});

describe('createHeadTwinTypeModule', () => {
  const module = createHeadTwinTypeModule({ kind: 'resource' });

  it('builds from the head file and round-trips through JSON', async () => {
    const dir = unitDir(RESOURCE_HEAD);
    const built = await module.build(dir, {});
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.value.head.name).toBe('Kiosk');
    const json = JSON.parse(JSON.stringify(module.toJSON(built.value))) as unknown;
    expect(module.fromJSON(json)).toEqual(built);
  });

  it('fails fast when the head file is missing', async () => {
    const built = await module.build(unitDir(), {});
    expect(!built.ok && built.errors[0]?.code).toBe('E_MISSING_FILE');
  });

  it('normalizes legacy fields before the shared check', () => {
    const story = createHeadTwinTypeModule({
      kind: 'story',
      normalize: (raw) => ({ ...raw, id: 'normalized' }),
    });
    const head = story.parse({ kind: 'story' });
    expect(head.ok && head.value.id).toBe('normalized');
  });
});

describe('createTwinTypeRegistry', () => {
  const resource = createHeadTwinTypeModule({ kind: 'resource' });

  it('looks modules up by kind', () => {
    const registry = createTwinTypeRegistry([resource]);
    expect(registry.getOne('resource')).toEqual({ ok: true, value: resource });
    expect(registry.getOne('story').ok).toBe(false);
    expect(registry.getAll()).toEqual([resource]);
  });

  it('rejects duplicate kinds', () => {
    expect(() => createTwinTypeRegistry([resource, resource])).toThrow('duplicate twin type module');
  });
});
