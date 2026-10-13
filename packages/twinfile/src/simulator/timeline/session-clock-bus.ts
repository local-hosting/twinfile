import type {
  SessionClockBus,
  SessionClockBusEvents,
  SessionClockBusHandler,
  SessionClockBusRecord,
} from '../types/session-clock-bus.js';
import type { WorldSessionAdvance, WorldSessionEdge } from '../types/world-session.js';
import type { TimelineSample } from '../types/twinfile-time.js';

export type { SessionClockBus, SessionClockBusEvents, SessionClockBusRecord, SessionClockNote } from '../types/session-clock-bus.js';

export type CreateSessionClockBusOptions = {
  /** Append each emit to `records` (for workbench / verify). */
  record?: boolean;
};

/** Grid positions between `fromT` and `toT` (inclusive of destination), one step at a time. */
export function sessionClockNoteTimes(fromT: number, toT: number, stepS: number): number[] {
  if (!Number.isFinite(stepS) || stepS <= 0) return [toT];
  if (fromT === toT) return [toT];
  const notes: number[] = [];
  if (toT > fromT) {
    for (let t = fromT + stepS; t < toT; t += stepS) {
      notes.push(t);
    }
  } else {
    for (let t = fromT - stepS; t > toT; t -= stepS) {
      notes.push(t);
    }
  }
  notes.push(toT);
  return notes;
}

export function publishSessionClockMove(options: {
  bus: SessionClockBus | undefined;
  fromT: number;
  body: WorldSessionAdvance;
  stepS: number;
  sampleAt: (t: number) => TimelineSample;
}): void {
  const { bus, fromT, body, stepS, sampleAt } = options;
  if (!bus) return;
  bus.emit('advance', body);
  for (const edge of body.edges) {
    bus.emit('edge', edge);
  }
  for (const t of sessionClockNoteTimes(fromT, body.playheadT, stepS)) {
    const sample = t === body.playheadT ? body.sample : sampleAt(t);
    bus.emit('note', {
      t,
      index: Math.round(t / stepS),
      sample,
    });
  }
}

export function createSessionClockBus(options?: CreateSessionClockBusOptions): SessionClockBus {
  const handlers = new Map<keyof SessionClockBusEvents, Set<SessionClockBusHandler<keyof SessionClockBusEvents>>>();
  const records: SessionClockBusRecord[] | undefined = options?.record ? [] : undefined;

  const on = <K extends keyof SessionClockBusEvents>(
    type: K,
    handler: SessionClockBusHandler<K>,
  ): (() => void) => {
    let set = handlers.get(type);
    if (!set) {
      set = new Set();
      handlers.set(type, set);
    }
    set.add(handler as SessionClockBusHandler<keyof SessionClockBusEvents>);
    return () => set!.delete(handler as SessionClockBusHandler<keyof SessionClockBusEvents>);
  };

  const emit = <K extends keyof SessionClockBusEvents>(type: K, payload: SessionClockBusEvents[K]): void => {
    if (records) {
      records.push({ type, payload } as SessionClockBusRecord);
    }
    const set = handlers.get(type);
    if (!set) return;
    for (const handler of set) {
      handler(payload);
    }
  };

  const clear = (): void => {
    handlers.clear();
  };

  return {
    on,
    emit,
    clear,
    ...(records ? { records } : {}),
  };
}

export function replaySessionClockRecords(
  bus: SessionClockBus,
  records: readonly SessionClockBusRecord[],
): void {
  for (const row of records) {
    bus.emit(row.type, row.payload);
  }
}

export function sessionClockEdgesFromRecords(records: readonly SessionClockBusRecord[]): WorldSessionEdge[] {
  return records.filter((row): row is SessionClockBusRecord & { type: 'edge' } => row.type === 'edge').map((row) => row.payload);
}
