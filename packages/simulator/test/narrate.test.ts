import { describe, expect, it } from 'vitest';

import {
  buildTwinfile,
} from '@local-hosting/twinfile-place';
import {
  loadRunUnit,
  resolveTwinfileAnchor,
} from '@local-hosting/twinfile-core';
import { buildPlaceNarrative, describeTwinAt, openTimelineForPlace } from '@local-hosting/twinfile-simulator';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { goldenSceneRun, testCatalogRoots } from '../../core/test/catalog-test-roots.js';

const importDir = dirname(fileURLToPath(import.meta.url));
const { examplesRoot } = testCatalogRoots(importDir);

describe('place narrative', () => {
  it('separates place, scenario, event, and now', async () => {
    const scenarioDir = goldenSceneRun(importDir, 'arena-storm-at-halftime');
    const built = await buildTwinfile(scenarioDir, {
      examplesRoot,
            writeLock: false,
          });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const loaded = loadRunUnit(scenarioDir);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const clock = loaded.value.twinfile.clock as {
      starts_at: string;
      duration: string;
      step: string;
    };
    const place = built.value.data as Record<string, unknown>;
    const resolvedArgs =
      (built.value.meta as { resolvedArgs?: Record<string, unknown> }).resolvedArgs ?? {};
    const timeline = openTimelineForPlace({
      clock,
      place,
      placeRoot: resolveTwinfileAnchor(scenarioDir, {
        ...loaded.value.twinfile,
        twinfilePath: loaded.value.twinfilePath,
      }),
      seed: 4,
      events: (built.value.events ?? []) as Record<string, unknown>[],
      resolvedArgs,
    });

    const narrative = describeTwinAt({
      place,
      twinfile: loaded.value.twinfile,
      spaceId: 'concourse-lower',
      sample: timeline.at(0),
      events: (built.value.events ?? []) as Record<string, unknown>[],
      clock,
      resolvedArgs,
      viewMode: 'place',
    });

    expect(narrative.sections.place.paragraph).toContain('concourse');
    expect(narrative.sections.place.paragraph).not.toContain('scenario asks');
    expect(narrative.sections.scenario.paragraph).toContain('scenario asks');
    expect(narrative.sections.scenario.paragraph).toContain('Resolved args:');
    expect(narrative.sections.scenario.paragraph).not.toContain('severe-weather');
    expect(narrative.sections.event.paragraph).toContain('Severe weather');
    expect(narrative.sections.event.paragraph).toContain('expects');
    expect(narrative.sections.moment?.paragraph).toContain('start of the scenario');
    expect(narrative.markdown).toMatch(/^## Place\n\n-/m);
    expect(narrative.markdown).toContain('## Scenario');
    expect(narrative.markdown).toContain('## Event');
    expect(narrative.facts.scenario.question).toBeDefined();
    expect(narrative.facts.event.events).toBeDefined();
  });

  it('reframes scenario question when focus shifts to another space', async () => {
    const scenarioDir = goldenSceneRun(importDir, 'arena-storm-at-halftime');
    const built = await buildTwinfile(scenarioDir, {
      examplesRoot,
            writeLock: false,
          });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const loaded = loadRunUnit(scenarioDir);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const clock = loaded.value.twinfile.clock as { starts_at: string; duration: string; step: string };
    const place = built.value.data as Record<string, unknown>;
    const resolvedArgs =
      (built.value.meta as { resolvedArgs?: Record<string, unknown> }).resolvedArgs ?? {};
    const timeline = openTimelineForPlace({
      clock,
      place,
      placeRoot: resolveTwinfileAnchor(scenarioDir, {
        ...loaded.value.twinfile,
        twinfilePath: loaded.value.twinfilePath,
      }),
      seed: 4,
      events: (built.value.events ?? []) as Record<string, unknown>[],
      resolvedArgs,
    });
    const narrative = describeTwinAt({
      place,
      twinfile: loaded.value.twinfile,
      spaceId: 'bowl-a',
      sample: timeline.at(0),
      events: (built.value.events ?? []) as Record<string, unknown>[],
      clock,
      viewMode: 'place',
    });
    expect(narrative.sections.scenario.paragraph).toMatch(/bowl|seating/i);
    expect(narrative.sections.event.paragraph).toContain('Severe weather');
    expect(narrative.sections.event.paragraph).not.toContain('scenario asks');
  });

  it('reports knowledge lag in the moment section', async () => {
    const scenarioDir = goldenSceneRun(importDir, 'river-swim-unsafe-known');
    const built = await buildTwinfile(scenarioDir, {
      examplesRoot,
            writeLock: false,
          });
    if (!built.ok) return;
    const loaded = loadRunUnit(scenarioDir);
    if (!loaded.ok) return;
    const clock = loaded.value.twinfile.clock as { starts_at: string; duration: string; step: string };
    const place = built.value.data as Record<string, unknown>;
    const resolvedArgs =
      (built.value.meta as { resolvedArgs?: Record<string, unknown> }).resolvedArgs ?? {};
    const timeline = openTimelineForPlace({
      clock,
      place,
      placeRoot: join(examplesRoot, 'river'),
      seed: 1,
      events: (built.value.events ?? []) as Record<string, unknown>[],
      resolvedArgs,
    });
    const narrative = describeTwinAt({
      place,
      twinfile: loaded.value.twinfile,
      spaceId: 'eddy-pool',
      sample: timeline.at(1800),
      events: (built.value.events ?? []) as Record<string, unknown>[],
      clock,
      resolvedArgs,
    });
    const readings = narrative.facts.moment?.trackReadings as Array<{ trackId: string; knowledgeLag: boolean }>;
    expect(readings.find((r) => r.trackId === 'turbidity')?.knowledgeLag).toBe(true);
    expect(narrative.sections.moment?.paragraph.toLowerCase()).toMatch(/reported/);
    expect(narrative.sections.event.paragraph).toContain('Dam release');
    expect(narrative.sections.scenario.paragraph).toContain('scenario asks');
  });

  it('throws on unknown space id', () => {
    expect(() =>
      buildPlaceNarrative({
        place: { spaces: [{ id: 'a', kind: 'room' }] },
        spaceId: 'missing',
      }),
    ).toThrow(/unknown space/);
  });
});
