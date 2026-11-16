/** Runner stdin `timeline` slice (full shape lives in `@doppler-group/twinfile-simulator`). */
type TimelinePayload = {
  clock: { starts_at: string; duration: string; step: string };
  samples: Array<{
    t: number;
    tracks: Record<string, number | null>;
    known: Record<string, number | null>;
  }>;
  units: Record<string, string>;
  phaseStarts?: Record<string, number>;
};

import { resourceShortfallMetrics } from './shelter-resources.js';

type HydraulicPayload = {
  place: Record<string, unknown>;
  scenario: { args: Record<string, unknown> };
};

type QueuePayload = {
  scenario: { args: Record<string, unknown> };
};

type ReplayPayload = {
  scenario: { args: Record<string, unknown> };
  timeline?: TimelinePayload;
};

function line(row: Record<string, unknown>): string {
  return JSON.stringify(row);
}

/** Egress / shelter baseline. Returns JSON Lines without writing stdout. */
export function runHydraulicLines(payload: HydraulicPayload): string[] {
  const merged = payload.place;
  const attendance = Number(payload.scenario.args.attendance ?? payload.scenario.args.occupancy ?? 1000);
  const targetRole = String(payload.scenario.args.target_role ?? 'exit');
  const spaces = (merged.spaces ?? []) as Array<{ id: string; capacity?: number; roles?: string[] }>;
  const openings = (merged.openings ?? []) as Array<{ id: string; width_m?: number; state?: string }>;
  const exits = openings.filter((opening) => opening.state !== 'closed');
  const exitCount = Math.max(exits.length, 1);
  const flowPerExit = 1.32 * Math.max((exits[0]?.width_m ?? 2) - 0.3, 0.5);
  const clearance = Math.ceil(attendance / (exitCount * flowPerExit));
  const lines = [line({ t: 0, type: 'phase', phase: 'warning' })];
  if (targetRole === 'shelter') {
    const shelterCap = spaces
      .filter((space) => space.roles?.includes('shelter'))
      .reduce((sum, space) => sum + (space.capacity ?? 0), 0);
    lines.push(line({ t: clearance, type: 'metric', id: 'time_to_shelter_s', value: clearance, unit: 's' }));
    lines.push(line({ t: clearance, type: 'metric', id: 'shelter_overflow', value: Math.max(0, attendance - shelterCap), unit: 'count' }));
    const resources = payload.scenario.args.resources as Record<string, unknown> | undefined;
    for (const { id, value } of resourceShortfallMetrics(merged, attendance, resources)) {
      lines.push(line({ t: clearance, type: 'metric', id, value, unit: 'count' }));
    }
  } else {
    lines.push(line({ t: clearance, type: 'metric', id: 'clearance_time_s', value: clearance, unit: 's' }));
    lines.push(line({ t: clearance, type: 'metric', id: 'peak_queue', value: Math.ceil(attendance / exitCount), unit: 'count' }));
  }
  return lines;
}

/** Gate / lane queue baseline. Returns JSON Lines without writing stdout. */
export function runQueueLines(payload: QueuePayload): string[] {
  const peakArrivals = Number(payload.scenario.args.peakArrivals ?? 40);
  const serviceS = Number(payload.scenario.args.service_s ?? 90);
  const lanes = Number(payload.scenario.args.lanes ?? 2);
  const stagingCap = Number(payload.scenario.args.stagingCap ?? 40);
  const rate = (lanes / serviceS) * 60;
  const maxQueue = peakArrivals;
  const spillAt = maxQueue > stagingCap ? Math.round(((maxQueue - stagingCap) / rate) * 60) : undefined;
  const clearance = Math.round(Math.ceil(maxQueue / rate) * 60);
  const lines = [
    line({ t: 0, type: 'phase', phase: 'outage' }),
    line({ t: 0, type: 'metric', id: 'max_queue', value: maxQueue, unit: 'count' }),
  ];
  if (spillAt !== undefined) {
    lines.push(line({ t: spillAt, type: 'metric', id: 'time_queue_spills_s', value: spillAt, unit: 's' }));
  }
  lines.push(line({ t: clearance, type: 'metric', id: 'clearance_time_s', value: clearance, unit: 's' }));
  return lines;
}

function fail(message: string): never {
  throw new Error(`runner-replay: ${message}`);
}

function firstCrossing(
  samples: TimelinePayload['samples'],
  pick: (sample: TimelinePayload['samples'][number]) => number | null,
  threshold: number,
): number | undefined {
  return samples.find((sample) => {
    const value = pick(sample);
    return value !== null && value >= threshold;
  })?.t;
}

/** Threshold replay over a precomputed timeline. Returns JSON Lines without writing stdout. */
export function runReplayLines(payload: ReplayPayload): string[] {
  const timeline = payload.timeline;
  if (!timeline) fail('scenario needs a clock: block (starts_at, duration, step)');
  const track = String(payload.scenario.args.track ?? '');
  if (!track) fail('scenario args need track: <track id>');
  const threshold = Number(payload.scenario.args.threshold);
  if (!Number.isFinite(threshold)) fail('scenario args need a numeric threshold');
  if (!timeline.samples.some((sample) => track in sample.tracks)) fail(`timeline has no track "${track}"`);

  const unit = timeline.units[track] ?? '';
  const values = timeline.samples
    .map((sample) => sample.tracks[track])
    .filter((value): value is number => value !== null && value !== undefined);
  const unsafeAt = firstCrossing(timeline.samples, (sample) => sample.tracks[track] ?? null, threshold);
  const knownAt = firstCrossing(timeline.samples, (sample) => sample.known[track] ?? null, threshold);
  const endT = timeline.samples.at(-1)?.t ?? 0;
  const releaseT = timeline.phaseStarts?.release ?? 0;
  const lines = [line({ t: releaseT, type: 'phase', phase: 'release' })];
  if (unsafeAt !== undefined) {
    lines.push(line({ t: unsafeAt, type: 'metric', id: 'time_until_unsafe_s', value: unsafeAt, unit: 's' }));
  }
  if (knownAt !== undefined) {
    lines.push(line({ t: knownAt, type: 'metric', id: 'time_until_known_unsafe_s', value: knownAt, unit: 's' }));
  }
  if (values.length > 0) {
    lines.push(line({ t: endT, type: 'metric', id: `peak_${track}`, value: Math.max(...values), unit }));
  }
  return lines;
}
