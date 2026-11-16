import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildTwinfile,
} from '@doppler-group/twinfile-place';
import {
  composeRunners,
  loadRunUnit,
} from '@doppler-group/twinfile-core';
import { createRunPayload } from '@doppler-group/twinfile-simulator';
import { goldenSceneRun, testExamplesRoot } from '../../core/test/catalog-test-roots.js';

const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

describe('compose runners', () => {
  it('runs hydraulic and queue on one clock and tags each record', async () => {
    const dir = goldenSceneRun(dirname(fileURLToPath(import.meta.url)), 'shelter-at-cap');
    const built = await buildTwinfile(dir, { examplesRoot, writeLock: false, noCache: true });
    const loaded = loadRunUnit(dir);
    if (!built.ok || !loaded.ok) {
      const errors = !built.ok ? built.errors : loaded.errors;
      throw new Error(errors.map((error) => error.message).join('; '));
    }
    const resolvedArgs = (built.value.meta as { resolvedArgs?: Record<string, unknown> }).resolvedArgs ?? {};
    const payload = createRunPayload({
      built: built.value,
      layers: built.value.layers,
      twinfile: loaded.value.twinfile,
      runName: 'shelter-at-cap',
      args: resolvedArgs,
      placeRoot: join(examplesRoot, 'shop'),
      seed: 1,
    });
    expect(payload.timeline).toBeTruthy();
    const result = composeRunners({
      ...payload,
      scenario: {
        ...(payload.scenario as Record<string, unknown>),
        runners: [
          { id: 'flood', runner: 'npm:@twinfile/runner-hydraulic@^0' },
          { id: 'queue', runner: 'npm:@twinfile/runner-queue@^0' },
        ],
      },
    });
    expect(result.exitCode).toBe(0);
    const rows = result.lines.map((line) => JSON.parse(line) as { runner: string; t: number });
    expect(new Set(rows.map((row) => row.runner))).toEqual(new Set(['flood', 'queue']));
    const times = rows.map((row) => row.t);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('exits non-zero when a child runner is unknown', () => {
    const result = composeRunners({
      scenario: { runners: [{ id: 'flood', runner: 'npm:@twinfile/runner-missing@^0' }] },
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.lines).toEqual([]);
  });
});
