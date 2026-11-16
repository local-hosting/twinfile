import { resolvePhaseEnds, resolvePhaseStarts } from '../timeline/phase-starts.js';
import type { PlaceEvent } from '../types/place-event.js';
import type { ClockSpec, PhaseEnds, PhaseStarts } from '../types/twinfile-time.js';
import type { WorldSessionEdge } from '../types/world-session.js';

/** Hazard / event programme on the session timeline — separate from {@link createClock} grid math. */
export class Weather {
  readonly id: string;
  readonly phaseStarts: PhaseStarts;
  readonly phaseEnds: PhaseEnds;

  private constructor(id: string, phaseStarts: PhaseStarts, phaseEnds: PhaseEnds) {
    this.id = id;
    this.phaseStarts = phaseStarts;
    this.phaseEnds = phaseEnds;
  }

  static fromPlaceEvent(
    event: Pick<PlaceEvent, 'id' | 'phases' | 'args'>,
    clock: ClockSpec,
    resolvedArgs: Record<string, unknown>,
  ): Weather {
    const ctx = { clock, events: [{ phases: event.phases, args: event.args }], resolvedArgs };
    return new Weather(event.id, resolvePhaseStarts(ctx), resolvePhaseEnds(ctx));
  }

  static fromBundledEvent(
    event: Record<string, unknown>,
    clock: ClockSpec,
    resolvedArgs: Record<string, unknown>,
  ): Weather | undefined {
    const id = typeof event.id === 'string' ? event.id : undefined;
    if (!id) return undefined;
    return Weather.fromPlaceEvent(
      {
        id,
        phases: Array.isArray(event.phases) ? (event.phases as string[]) : undefined,
        args: event.args as PlaceEvent['args'],
      },
      clock,
      resolvedArgs,
    );
  }

  /** Active phase at playhead `t` (seconds from `clock.starts_at`), if any. */
  phaseAt(t: number): string | undefined {
    const ordered = this.phasesOrdered();
    let current: string | undefined;
    for (const phase of ordered) {
      const start = this.phaseStarts[phase];
      if (start === undefined) continue;
      if (start <= t) current = phase;
    }
    if (current === undefined) return undefined;
    const end = this.phaseEnds[current];
    if (end !== undefined && t > end) return undefined;
    return current;
  }

  /** Phase-enter edges when playhead moves from `prevT` to `nextT`. */
  edgesBetween(prevT: number, nextT: number): WorldSessionEdge[] {
    const lo = Math.min(prevT, nextT);
    const hi = Math.max(prevT, nextT);
    const edges: WorldSessionEdge[] = [];
    for (const [phase, startT] of Object.entries(this.phaseStarts)) {
      if (startT > lo && startT <= hi && startT !== prevT) {
        edges.push({ kind: 'phase.enter', phase, t: startT });
      }
    }
    return edges;
  }

  private phasesOrdered(): string[] {
    const keys = new Set([...Object.keys(this.phaseStarts), ...Object.keys(this.phaseEnds)]);
    return [...keys].sort((a, b) => {
      const sa = this.phaseStarts[a] ?? Number.POSITIVE_INFINITY;
      const sb = this.phaseStarts[b] ?? Number.POSITIVE_INFINITY;
      return sa - sb;
    });
  }
}

export function createWeathersFromPlace(
  clock: ClockSpec,
  events: Record<string, unknown>[] | undefined,
  resolvedArgs: Record<string, unknown>,
): Weather[] {
  const out: Weather[] = [];
  for (const event of events ?? []) {
    const weather = Weather.fromBundledEvent(event, clock, resolvedArgs);
    if (weather) out.push(weather);
  }
  return out;
}


export function mergeWeatherPhaseStarts(weathers: Weather[]): PhaseStarts {
  const out: PhaseStarts = {};
  for (const weather of weathers) {
    Object.assign(out, weather.phaseStarts);
  }
  return out;
}

export function mergeWeatherPhaseEnds(weathers: Weather[]): PhaseEnds {
  const out: PhaseEnds = {};
  for (const weather of weathers) {
    Object.assign(out, weather.phaseEnds);
  }
  return out;
}
