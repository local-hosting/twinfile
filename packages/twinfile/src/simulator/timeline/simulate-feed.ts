import { uniformUnitFromSha256Utf8 } from '../../core/build/digest.js';
import { type Clock, requireDurationSeconds } from './clock.js';
import type { FeedRow, PhaseStarts } from '../types/twinfile-time.js';

export type SimulateResponse = {
  phase: string;
  peak: number;
  rise: string;
  decay: string;
};

export type SimulatePropertyModel = {
  baseline?: number;
  noise?: number;
  response?: SimulateResponse;
};

export type SimulateSpec = {
  every: string;
  uplink?: string;
  dropout?: number;
  [property: string]: unknown;
};

export type SimulatedDevice = {
  id: string;
  unit?: string;
  properties?: string[];
  simulate: SimulateSpec;
};

function seededUnit(seed: number, ...parts: string[]): number {
  return uniformUnitFromSha256Utf8(`${seed}:${parts.join(':')}`);
}

function propertyModel(spec: SimulateSpec, property: string): SimulatePropertyModel | undefined {
  const raw = spec[property];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return raw as SimulatePropertyModel;
}

function responseBump(dtS: number, peak: number, riseS: number, decayS: number): number {
  if (dtS <= 0) return 0;
  if (dtS < riseS) return (peak * dtS) / riseS;
  const after = dtS - riseS;
  if (after < decayS) return peak * (1 - after / decayS);
  return 0;
}

function uplinkAvailableMs(observedMs: number, startMs: number, uplinkMs: number): number {
  if (uplinkMs <= 0) return observedMs;
  const offset = observedMs - startMs;
  const slots = Math.ceil(offset / uplinkMs);
  return startMs + Math.max(slots, 1) * uplinkMs;
}

function isoFromMs(ms: number): string {
  return new Date(ms).toISOString().replace('.000Z', 'Z');
}

/** Pure function: simulated reading at an instant (before dropout). */
export function simulatedValueAt(
  observedMs: number,
  startMs: number,
  property: string,
  device: SimulatedDevice,
  phaseStarts: PhaseStarts,
  seed: number,
): number {
  const model = propertyModel(device.simulate, property);
  if (!model) throw new Error(`device "${device.id}" simulate has no model for property "${property}"`);

  const everyS = requireDurationSeconds(device.simulate.every, `device ${device.id} simulate.every`);
  const bucket = Math.floor((observedMs - startMs) / (everyS * 1000));
  const noise = model.noise ?? 0;
  const u = seededUnit(seed, device.id, property, String(bucket), 'noise');
  let value = (model.baseline ?? 0) + (u - 0.5) * 2 * noise;

  const response = model.response;
  if (response) {
    const phaseT = phaseStarts[response.phase];
    if (phaseT === undefined) {
      throw new Error(`device "${device.id}" response.phase "${response.phase}" is not on the scenario clock`);
    }
    const riseS = requireDurationSeconds(response.rise, `device ${device.id} response.rise`);
    const decayS = requireDurationSeconds(response.decay, `device ${device.id} response.decay`);
    const dtS = (observedMs - startMs) / 1000 - phaseT;
    value += responseBump(dtS, response.peak, riseS, decayS);
  }
  return value;
}

function shouldDropReading(seed: number, deviceId: string, bucket: number, dropout: number): boolean {
  if (dropout <= 0) return false;
  return seededUnit(seed, deviceId, String(bucket), 'dropout') < dropout;
}

/** Generate JSON Lines feed rows for one simulated device over the scenario clock. */
export function generateSimulatedFeedRows(
  device: SimulatedDevice,
  clock: Clock,
  phaseStarts: PhaseStarts,
  seed: number,
): FeedRow[] {
  const everyS = requireDurationSeconds(device.simulate.every, `device ${device.id} simulate.every`);
  const uplinkS = device.simulate.uplink
    ? requireDurationSeconds(device.simulate.uplink, `device ${device.id} simulate.uplink`)
    : 0;
  const uplinkMs = uplinkS * 1000;
  const dropout = typeof device.simulate.dropout === 'number' ? device.simulate.dropout : 0;
  const properties = device.properties?.length
    ? device.properties
    : Object.keys(device.simulate).filter((k) => !['every', 'uplink', 'dropout'].includes(k));
  if (properties.length === 0) {
    throw new Error(`device "${device.id}" simulate needs properties[] or property models`);
  }

  const rows: FeedRow[] = [];
  const startMs = clock.startMs;
  const endMs = startMs + clock.durationS * 1000;

  for (let observedMs = startMs; observedMs <= endMs; observedMs += everyS * 1000) {
    const bucket = Math.floor((observedMs - startMs) / (everyS * 1000));
    if (shouldDropReading(seed, device.id, bucket, dropout)) continue;

    for (const property of properties) {
      const value =
        Math.round(simulatedValueAt(observedMs, startMs, property, device, phaseStarts, seed) * 1000) / 1000;
      const row: FeedRow = {
        device_id: device.id,
        observed_property: property,
        value,
        unit: device.unit,
        observed_at: isoFromMs(observedMs),
        quality: 'ok',
      };
      if (uplinkMs > 0) {
        row.available_at = isoFromMs(uplinkAvailableMs(observedMs, startMs, uplinkMs));
      }
      rows.push(row);
    }
  }
  return rows;
}
