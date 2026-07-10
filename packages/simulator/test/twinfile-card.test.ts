import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildTwinfile,
  buildTwinfileSummary,
} from '@local-hosting/twinfile-place';
import {
  formatTwinfileSummaryMarkdown,
  loadRunUnit,
  TWINFILE_USE_MODES,
  type TwinfileSummaryBlock,
  type TwinfileSummaryV1,
} from '@local-hosting/twinfile-core';
import {
  PlaceHost,
  getRegisteredPlaceEvent,
  handleMcpRequest,
  placeEventToHead,
} from '@local-hosting/twinfile-simulator';
import { goldenSceneRunDir, testCatalogRoots } from '../../core/test/catalog-test-roots.js';

const importDir = dirname(fileURLToPath(import.meta.url));
const { examplesRoot } = testCatalogRoots(importDir);

const FIVE_UNITS = [
  { id: 'shop-place', path: join(examplesRoot, 'shop') },
  { id: 'airport-morning-scenario', path: goldenSceneRunDir(importDir, 'airport-morning-checkpoint') },
  { id: 'expo-place', path: join(examplesRoot, 'expo') },
  { id: 'airport-place', path: join(examplesRoot, 'airport') },
  { id: 'arena-place', path: join(examplesRoot, 'arena') },
] as const;

async function summaryForUnit(unitPath: string) {
  const opened = await PlaceHost.load(unitPath, {
    examplesRoot,
        writeLock: false,
        noCache: true,
  });
  expect(opened.ok, unitPath).toBe(true);
  if (!opened.ok) throw new Error('build failed');
  return opened.value.summary();
}

describe('TwinfileSummaryV1', () => {
  it.each(FIVE_UNITS)('$id matches schema and markdown printout', async ({ path: unitPath }) => {
    const summary = await summaryForUnit(unitPath);
    expect(summary.schema).toBe('twinfile.summary.v1');
    for (const mode of TWINFILE_USE_MODES) {
      expect(summary.layouts[mode].schema).toBe('twinfile.summary.layout.v1');
      expect(summary.layouts[mode].mode).toBe(mode);
      expect(summary.layouts[mode].blocks[0]?.type).toBe('hero');
      expect(summary.layouts[mode].blocks.length).toBeGreaterThan(1);
    }
    expect(summary.header.name.length).toBeGreaterThan(0);
    expect(summary.header.icon.length).toBeGreaterThan(0);
    expect(formatTwinfileSummaryMarkdown(summary)).toContain(summary.header.name);
    expect(summary.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('shop site card is state io only (no compose fixed/variables)', async () => {
    const card = await summaryForUnit(join(examplesRoot, 'shop'));
    expect(card.head.kind).toBe('place');
    expect(card.fixed).toEqual([]);
    expect(card.variables).toEqual([]);
    expect(card.io.outputs.some((row) => row.id === 'signal:occupancy')).toBe(true);
    expect(card.io.outputs.some((row) => row.id === 'capacity.shelter')).toBe(false);
  });

  it('severe-weather catalog event lists expects as inputs', () => {
    const event = getRegisteredPlaceEvent('severe-weather');
    expect(event?.id).toBe('severe-weather');
    const card = buildTwinfileSummary({ twinfile: placeEventToHead(event!) });
    expect(card.head.kind).toBe('event');
    expect(card.io.inputs.map((row) => row.id).sort()).toEqual([
      'all-clearEndAt',
      'exit',
      'outdoor',
      'shelter',
      'warningAt',
    ]);
  });

  it('arena site card does not expose patch modules as io outputs', async () => {
    const card = await summaryForUnit(join(examplesRoot, 'arena'));
    expect(card.fixed).toEqual([]);
    expect(card.variables).toEqual([]);
    expect(card.io.outputs.some((r) => r.id.startsWith('patch:'))).toBe(false);
  });

  it.each(FIVE_UNITS)('$id hero and sections do not repeat each other', async ({ path: unitPath }) => {
    const card = await summaryForUnit(unitPath);
    for (const mode of TWINFILE_USE_MODES) {
      expectNoRepeats(card, card.layouts[mode].blocks);
    }
  });

  it('arena site layout is hero plus signal io only', async () => {
    const card = await summaryForUnit(join(examplesRoot, 'arena'));
    expect(card.layouts.place.title).toBe('Site');
    expect(card.layouts.place.blocks.map((b) => b.type)).toEqual(['hero', 'io']);
    const hero = card.layouts.place.blocks[0];
    expect(hero?.type).toBe('hero');
    if (hero?.type === 'hero') {
      expect(hero.chips).toEqual([]);
      expect(hero.title).toBe(card.header.name);
    }
    const io = card.layouts.place.blocks[1];
    expect(io?.type).toBe('io');
    expect(card.fixed).toEqual([]);
    expect(card.variables).toEqual([]);
    expect(card.io.outputs.some((r) => r.kind === 'capacity')).toBe(false);
  });

  it('scenario card uses manifest name, not ref id', async () => {
    const runDir = goldenSceneRunDir(importDir, 'airport-morning-checkpoint');
    const wifi = await summaryForUnit(runDir);
    const loaded = loadRunUnit(runDir);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) throw new Error('load failed');
    expect(loaded.value.twinfile.question).toBeUndefined();
    expect(wifi.header.name).toBe('Morning checkpoint');
    expect(wifi.head.id).toBe('airport-morning-checkpoint');
  });

  it('scenario card omits question block (MCP catalog holds test prompts)', async () => {
    const hasQuestion = (card: TwinfileSummaryV1) =>
      card.layouts.place.blocks.some((b) => b.type === 'list' && b.rows.some((r) => r.id === 'question'));
    const morning = await summaryForUnit(goldenSceneRunDir(importDir, 'airport-morning-checkpoint'));
    expect(hasQuestion(morning)).toBe(false);
  });

  it('catalog event layout lists expects as io', () => {
    const event = getRegisteredPlaceEvent('severe-weather');
    const card = buildTwinfileSummary({ twinfile: placeEventToHead(event!) });
    expect(card.layouts.place.blocks.some((b) => b.type === 'io')).toBe(true);
  });

  it('arena site layout has no stats rollups block', async () => {
    const card = await summaryForUnit(join(examplesRoot, 'arena'));
    expect(card.layouts.place.blocks.some((b) => b.type === 'stats')).toBe(false);
    expect(card.fixed).toEqual([]);
    expect(card.variables).toEqual([]);
  });

  it('MCP place.card returns card JSON and ASCII without HTML', async () => {
    const shop = join(examplesRoot, 'shop');
    const result = await handleMcpRequest(shop, { method: 'place.card', params: {} }, { noCache: true });
    const summary = result.summary as { schema?: string };
    expect(summary?.schema).toBe('twinfile.summary.v1');
    expect((result.card as { schema?: string })?.schema).toBe('twinfile.summary.v1');
    expect(result.digest).toBeTruthy();
    expect(typeof result.ascii).toBe('string');
    expect(result).not.toHaveProperty('html');
  });
});

function expectNoRepeats(card: TwinfileSummaryV1, blocks: TwinfileSummaryBlock[]) {
  const hero = blocks.find((b) => b.type === 'hero');
  const versionRef = `id ${card.head.id}@${card.head.version}`;
  expect(card.header.subtitle ?? '').not.toContain(versionRef);
  expect(card.header.subtitle ?? '').not.toContain(card.head.kind);
  if (hero?.type === 'hero' && hero.chips.length > 0) {
    expect(hero.chips).toContain(versionRef);
  }
  const stats = blocks.find((b) => b.type === 'stats');
  const lists = blocks.filter((b) => b.type === 'list');
  const statIds = new Set(stats?.type === 'stats' ? stats.items.map((i) => i.id) : []);
  for (const list of lists) {
    if (list.type !== 'list') continue;
    expect(list.rows.filter((r) => statIds.has(r.id))).toEqual([]);
  }
  const io = blocks.find((b) => b.type === 'io');
  if (io?.type === 'io') {
    expect([...io.inputs, ...io.outputs].some((r) => r.id.startsWith('_'))).toBe(false);
  }
}
