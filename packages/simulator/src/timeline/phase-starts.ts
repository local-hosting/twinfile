import { parseDurationToSeconds } from '@doppler-group/twinfile-core';
import { parseInstant } from './clock.js';
import type { ClockSpec, PhaseEnds, PhaseStarts } from '../types/twinfile-time.js';
import type { TwinfileUseMode } from '@doppler-group/twinfile-core';

export type { PhaseEnds, PhaseStarts };

/** Legacy manifest `mode:` — ignored; runs use context event inputs. */
export function scenarioUseMode(_twinfile: Record<string, unknown>): TwinfileUseMode | undefined {
  return undefined;
}

/** Legacy manifest `mode:` — ignored. */
export function catalogUseMode(_twinfile: Record<string, unknown>): TwinfileUseMode | undefined {
  return undefined;
}

/** Timeline layout id (event phases live in `active`, not a catalog mode). */
export function useModeAt(
  _t: number,
  _phaseStarts?: PhaseStarts,
  _scenarioMode?: TwinfileUseMode,
  _phaseEnds?: PhaseEnds,
): TwinfileUseMode {
  return 'place';
}

function phaseAtArgName(phaseId: string): string {
  return `${phaseId}At`;
}

function phaseEndArgName(phaseId: string): string {
  return `${phaseId}EndAt`;
}

function resolvePhaseInstantSeconds(raw: unknown, startMs: number, label: string): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') {
    throw new Error(`${label} must be seconds, an ISO duration, or an RFC 3339 instant`);
  }
  const asDur = parseDurationToSeconds(raw);
  if (asDur !== undefined) return asDur;
  const ms = parseInstant(raw, label);
  return (ms - startMs) / 1000;
}

/** Map event phase ids to `t` using scenario args (`releaseAt`, …) declared on events. */
export function resolvePhaseStarts(options: {
  clock: ClockSpec;
  events: Record<string, unknown>[];
  resolvedArgs: Record<string, unknown>;
}): PhaseStarts {
  const startMs = parseInstant(options.clock.starts_at, 'clock.starts_at');
  const phaseIds: string[] = [];
  const timeArgKeys = new Set<string>();

  for (const event of options.events) {
    const phases = event.phases;
    if (Array.isArray(phases)) {
      for (const p of phases) {
        if (typeof p === 'string') phaseIds.push(p);
      }
    }
    const args = event.args;
    if (args && typeof args === 'object' && !Array.isArray(args)) {
      for (const [key, spec] of Object.entries(args as Record<string, unknown>)) {
        if (spec && typeof spec === 'object' && !Array.isArray(spec) && (spec as { type?: string }).type === 'time') {
          timeArgKeys.add(key);
        }
      }
    }
  }

  const out: PhaseStarts = {};
  for (const phase of [...new Set(phaseIds)]) {
    const argKey = phaseAtArgName(phase);
    if (!timeArgKeys.has(argKey)) continue;
    const raw = options.resolvedArgs[argKey];
    if (raw === undefined) {
      if (phase === 'release') out[phase] = 0;
      continue;
    }
    out[phase] = resolvePhaseInstantSeconds(raw, startMs, argKey);
  }
  return out;
}

/** Map event phase ids to end `t` using scenario args (`all-clearEndAt`, …). */
export function resolvePhaseEnds(options: {
  clock: ClockSpec;
  events: Record<string, unknown>[];
  resolvedArgs: Record<string, unknown>;
}): PhaseEnds {
  const startMs = parseInstant(options.clock.starts_at, 'clock.starts_at');
  const phaseIds: string[] = [];
  const timeArgKeys = new Set<string>();

  for (const event of options.events) {
    const phases = event.phases;
    if (Array.isArray(phases)) {
      for (const p of phases) {
        if (typeof p === 'string') phaseIds.push(p);
      }
    }
    const args = event.args;
    if (args && typeof args === 'object' && !Array.isArray(args)) {
      for (const [key, spec] of Object.entries(args as Record<string, unknown>)) {
        if (spec && typeof spec === 'object' && !Array.isArray(spec) && (spec as { type?: string }).type === 'time') {
          timeArgKeys.add(key);
        }
      }
    }
  }

  const out: PhaseEnds = {};
  for (const phase of [...new Set(phaseIds)]) {
    const argKey = phaseEndArgName(phase);
    if (!timeArgKeys.has(argKey)) continue;
    const raw = options.resolvedArgs[argKey];
    if (raw === undefined) continue;
    out[phase] = resolvePhaseInstantSeconds(raw, startMs, argKey);
  }
  return out;
}
