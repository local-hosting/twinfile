import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createClock, parseInstant } from './clock.js';
import { generateSimulatedFeedRows, type SimulatedDevice } from './simulate-feed.js';
import type { ClockSpec, FeedRow, Interpolation, PhaseStarts, TrackDef } from '../types/twinfile-time.js';

type FeedPoint = { observedMs: number; availableMs: number; value: number };

export type FeedSeries = {
  valueAt(ms: number, interpolate: Interpolation, stepMs: number): number | null;
  knownAt(ms: number): number | null;
};

type FeedDevice = {
  id: string;
  unit?: string;
  properties?: string[];
  feed?: { protocol?: string; url?: string; replay?: string };
  simulate?: SimulatedDevice['simulate'];
};

function feedFile(device: FeedDevice, placeRoot: string): string {
  const feed = device.feed;
  const protocol = feed?.protocol;
  if (protocol === 'file') {
    if (!feed?.url) throw new Error(`device "${device.id}" feed.protocol file needs feed.url`);
    return resolve(placeRoot, feed.url);
  }
  if (protocol === 'sensorthings' || protocol === 'ngsi-ld') {
    if (!feed?.replay) {
      throw new Error(`device "${device.id}" feed.protocol ${protocol} needs feed.replay written by twin feed pull`);
    }
    return resolve(placeRoot, feed.replay);
  }
  throw new Error(`device "${device.id}" needs simulate: or feed.protocol file, sensorthings, or ngsi-ld`);
}

function requireRowField(row: Record<string, unknown>, key: string, where: string): unknown {
  if (row[key] === undefined) throw new Error(`${where}: missing ${key}`);
  return row[key];
}

/** Read a JSON Lines feed; every row is checked so bad data fails the run instead of skewing it. */
export function loadFeedRows(path: string): FeedRow[] {
  if (!path.endsWith('.jsonl')) throw new Error(`feed ${path}: feeds must be JSON Lines (.jsonl)`);
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line, i) => [line.trim(), i + 1] as const)
    .filter(([line]) => line.length > 0)
    .map(([line, lineNo]) => {
      const where = `${path}:${lineNo}`;
      const row = JSON.parse(line) as Record<string, unknown>;
      const value = requireRowField(row, 'value', where);
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${where}: value must be a number`);
      requireRowField(row, 'device_id', where);
      requireRowField(row, 'observed_property', where);
      parseInstant(String(requireRowField(row, 'observed_at', where)), `${where} observed_at`);
      if (row.available_at !== undefined) parseInstant(String(row.available_at), `${where} available_at`);
      return row as FeedRow;
    });
}

export type ResolveTrackFeedsOptions = {
  mergedPlace: Record<string, unknown>;
  tracks: TrackDef[];
  placeRoot: string;
  clock?: ClockSpec;
  seed?: number;
  phaseStarts?: PhaseStarts;
};

/** Load file feeds and/or generate simulated feeds for devices referenced by `feed` tracks. */
export function resolveTrackFeeds(options: ResolveTrackFeedsOptions): FeedRow[] {
  const { mergedPlace, tracks, placeRoot, clock, seed = 1, phaseStarts = {} } = options;
  const devices = [...((mergedPlace.sensors ?? []) as FeedDevice[]), ...((mergedPlace.gauges ?? []) as FeedDevice[])];
  const wanted = new Set(tracks.filter((t) => t.source === 'feed').map((t) => t.device!));
  const rows: FeedRow[] = [];
  for (const id of wanted) {
    const device = devices.find((d) => d.id === id);
    if (!device) throw new Error(`feed track reads device "${id}", which is not a sensor or gauge`);
    if (device.simulate) {
      if (!clock) throw new Error(`device "${id}" uses simulate: but no scenario clock was provided`);
      const simDevice = device as SimulatedDevice;
      rows.push(...generateSimulatedFeedRows(simDevice, createClock(clock), phaseStarts, seed));
      continue;
    }
    rows.push(...loadFeedRows(feedFile(device, placeRoot)));
  }
  return rows;
}

function usable(row: FeedRow, device: string, property: string): boolean {
  const qualityOk = row.quality === undefined || row.quality === 'ok';
  return row.device_id === device && row.observed_property === property && qualityOk;
}

export function compileFeedSeries(rows: FeedRow[], device: string, property: string): FeedSeries {
  const points: FeedPoint[] = rows
    .filter((r) => usable(r, device, property))
    .map((r) => {
      const observedMs = parseInstant(r.observed_at, 'observed_at');
      const availableMs = r.available_at ? parseInstant(r.available_at, 'available_at') : observedMs;
      if (availableMs < observedMs) {
        throw new Error(`feed ${device}/${property}: available_at ${r.available_at} is before observed_at`);
      }
      return { observedMs, availableMs, value: r.value };
    })
    .sort((a, b) => a.observedMs - b.observedMs);
  if (points.length === 0) throw new Error(`feed ${device}/${property} has no usable rows`);

  function lastAtOrBefore(ms: number): number {
    let idx = -1;
    for (let i = 0; i < points.length && points[i]!.observedMs <= ms; i += 1) idx = i;
    return idx;
  }

  return {
    valueAt(ms, interpolate, stepMs) {
      const i = lastAtOrBefore(ms);
      if (i < 0) return null;
      const here = points[i]!;
      if (interpolate === 'none') return here.observedMs > ms - stepMs ? here.value : null;
      const next = points[i + 1];
      if (interpolate === 'step' || !next || here.observedMs === ms) return here.value;
      const f = (ms - here.observedMs) / (next.observedMs - here.observedMs);
      return here.value + (next.value - here.value) * f;
    },
    knownAt(ms) {
      let best: FeedPoint | undefined;
      for (const p of points) {
        if (p.availableMs <= ms && (!best || p.observedMs > best.observedMs)) best = p;
      }
      return best ? best.value : null;
    },
  };
}
