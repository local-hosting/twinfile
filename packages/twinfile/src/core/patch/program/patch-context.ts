import type { ContextSlice, ContextEventState, PatchCordId } from '../../types/patch-program.js';
import { SignalFeed } from './signal-feed.js';
import { EventPulse } from './event-pulse.js';
import type { EventPulseKind } from '../../types/event-pulse.js';

export class PatchContext {
  readonly signals: Record<string, unknown>;
  readonly events: ContextEventState[];
  readonly cuts: Set<PatchCordId>;
  readonly feeds: SignalFeed[];

  constructor(slice: ContextSlice = {}) {
    this.signals = { ...(slice.signals ?? {}) };
    this.events = [...(slice.events ?? [])];
    this.cuts = new Set(slice.cuts ?? []);
    this.feeds = (slice.feeds ?? []).map(
      (row) =>
        new SignalFeed({
          wire: row.wire,
          value: row.value,
          virtualModule: row.virtualModule,
          port: row.port,
          to: row.to,
        }),
    );
  }

  withSignals(signals: Record<string, unknown>): PatchContext {
    return new PatchContext({
      signals: { ...this.signals, ...signals },
      events: this.events,
      cuts: [...this.cuts],
      feeds: this.feeds.map((f) => ({
        wire: f.wire,
        value: f.value,
        virtualModule: f.virtualModule,
        port: f.port,
        to: f.to,
      })),
    });
  }

  withEvent(row: ContextEventState): PatchContext {
    const events = this.events.filter((s) => s.ref !== row.ref);
    events.push(row);
    return new PatchContext({
      signals: this.signals,
      events,
      cuts: [...this.cuts],
      feeds: this.feeds.map((f) => ({
        wire: f.wire,
        value: f.value,
        virtualModule: f.virtualModule,
        port: f.port,
        to: f.to,
      })),
    });
  }

  withCut(cordId: PatchCordId): PatchContext {
    const cuts = new Set(this.cuts);
    cuts.add(cordId);
    return new PatchContext({
      signals: this.signals,
      events: this.events,
      cuts: [...cuts],
      feeds: this.feeds.map((f) => ({
        wire: f.wire,
        value: f.value,
        virtualModule: f.virtualModule,
        port: f.port,
        to: f.to,
      })),
    });
  }

  toSlice(): ContextSlice {
    return {
      signals: { ...this.signals },
      events: [...this.events],
      cuts: [...this.cuts],
      feeds: this.feeds.map((f) => ({
        wire: f.wire,
        value: f.value,
        virtualModule: f.virtualModule,
        port: f.port,
        to: f.to,
      })),
    };
  }

  eventPulses(
    headsByRef: Map<string, Record<string, unknown>>,
  ): EventPulse[] {
    const out: EventPulse[] = [];
    for (const row of this.events) {
      if (!row.enabled) continue;
      const head = headsByRef.get(row.ref) ?? headsByRef.get(row.ref.split(':')[0] ?? '');
      if (!head) continue;
      const pulse = (row.pulse ?? 'fast') as EventPulseKind;
      out.push(
        new EventPulse(head, {
          phase: row.phase ?? (Array.isArray(head.phases) ? String(head.phases[0]) : 'warning'),
          pulse,
          edge: 'enter',
          args: row.args,
          ...(row.target ? { to: row.target } : {}),
        }),
      );
    }
    return out;
  }
}
