import type { ContextSlice, ContextSituationState, PatchCordId } from '../../types/patch-program.js';
import { SignalFeed } from './signal-feed.js';
import { SituationPulse } from './situation-pulse.js';
import type { SituationPulseKind } from '../../types/situation-pulse.js';

export class PatchContext {
  readonly signals: Record<string, unknown>;
  readonly situations: ContextSituationState[];
  readonly cuts: Set<PatchCordId>;
  readonly feeds: SignalFeed[];

  constructor(slice: ContextSlice = {}) {
    this.signals = { ...(slice.signals ?? {}) };
    this.situations = [...(slice.situations ?? [])];
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
      situations: this.situations,
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

  withSituation(row: ContextSituationState): PatchContext {
    const situations = this.situations.filter((s) => s.ref !== row.ref);
    situations.push(row);
    return new PatchContext({
      signals: this.signals,
      situations,
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
      situations: this.situations,
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
      situations: [...this.situations],
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

  situationPulses(
    headsByRef: Map<string, Record<string, unknown>>,
  ): SituationPulse[] {
    const out: SituationPulse[] = [];
    for (const row of this.situations) {
      if (!row.enabled) continue;
      const head = headsByRef.get(row.ref) ?? headsByRef.get(row.ref.split(':')[0] ?? '');
      if (!head) continue;
      const pulse = (row.pulse ?? 'fast') as SituationPulseKind;
      out.push(
        new SituationPulse(head, {
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
