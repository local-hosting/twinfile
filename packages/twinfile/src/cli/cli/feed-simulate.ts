import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildTwinfile,
} from '@local-hosting/twinfile/place';
import {
  loadRunUnit,
  resolveAuditExamplesRoot,
  resolveExamplesRoot,
} from '@local-hosting/twinfile';
import { formatTwinErrors } from '@local-hosting/twinfile/cli';

import {
  createClock,
  generateSimulatedFeedRows,
  resolvePhaseStarts,
  type ClockSpec,
  type SimulatedDevice,
} from '@local-hosting/twinfile/simulator';

type FeedDevice = SimulatedDevice & { simulate: SimulatedDevice['simulate'] };

export async function runFeedSimulate(argv: string[]): Promise<number> {
  let dir = '.';
  let deviceId = '';
  let outPath = '';
  let seed = 1;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--device') {
      deviceId = argv[i + 1] ?? '';
      i += 1;
    } else if (arg === '--out') {
      outPath = argv[i + 1] ?? '';
      i += 1;
    } else if (arg === '--seed') {
      seed = Number(argv[i + 1]);
      i += 1;
    } else if (!arg.startsWith('-')) dir = arg;
  }
  if (!deviceId) {
    console.error('twin feed simulate requires --device <sensor-or-gauge-id>');
    return 2;
  }

  const scenarioDir = resolve(dir);
  const examplesRoot = resolveAuditExamplesRoot(scenarioDir) ?? resolveExamplesRoot(scenarioDir);
  if (!examplesRoot) {
    console.error('twin feed simulate requires TF_TWINFILE_ROOT');
    return 2;
  }

  const built = await buildTwinfile(scenarioDir, { examplesRoot, writeLock: false });
  if (!built.ok) {
    console.error(formatTwinErrors(scenarioDir, built.errors).join('\n'));
    return 1;
  }
  const loaded = loadRunUnit(scenarioDir);
  if (!loaded.ok) {
    console.error(formatTwinErrors(scenarioDir, loaded.errors).join('\n'));
    return 1;
  }
  const clock = loaded.value.twinfile.clock as ClockSpec | undefined;
  if (!clock) {
    console.error('twin feed simulate requires a scenario with clock:');
    return 1;
  }

  const place = built.value.data as Record<string, unknown>;
  const devices = [...((place.sensors ?? []) as FeedDevice[]), ...((place.gauges ?? []) as FeedDevice[])];
  const device = devices.find((d) => d.id === deviceId);
  if (!device?.simulate) {
    console.error(`device "${deviceId}" has no simulate: block on the merged place`);
    return 1;
  }

  const resolvedArgs =
    (built.value.meta as { resolvedArgs?: Record<string, unknown> }).resolvedArgs ?? {};
  const phaseStarts = resolvePhaseStarts({
    clock,
    events: (built.value.events ?? []) as Record<string, unknown>[],
    resolvedArgs,
  });
  const rows = generateSimulatedFeedRows(device, createClock(clock), phaseStarts, seed);
  const body = rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');

  if (outPath) {
    writeFileSync(resolve(outPath), body, 'utf8');
    console.log(`wrote ${rows.length} rows to ${outPath}`);
  } else {
    process.stdout.write(body);
  }
  return 0;
}
