import type { CompiledSchedule } from './schedule.js';
import type { TrackSampler } from './tracks.js';
import type { ActiveWhenGate } from '../types/twinfile-time.js';

function trackPassesGate(ms: number, gate: ActiveWhenGate, sampler: TrackSampler): boolean {
  const value = sampler(ms).value;
  if (value === null) return false;
  if (gate.min !== undefined && value < gate.min) return false;
  if (gate.max !== undefined && value > gate.max) return false;
  return true;
}

export function applyScheduleActiveWhen(
  compiled: CompiledSchedule,
  gate: ActiveWhenGate,
  samplers: Map<string, TrackSampler>,
): CompiledSchedule {
  const sampler = samplers.get(gate.track);
  if (!sampler) {
    throw new Error(`schedule ${compiled.def.id}: activeWhen track "${gate.track}" is not defined`);
  }
  const inner = compiled.activeAt.bind(compiled);
  return {
    def: compiled.def,
    activeAt(ms) {
      const hit = inner(ms);
      if (!hit) return undefined;
      return trackPassesGate(ms, gate, sampler) ? hit : undefined;
    },
  };
}
