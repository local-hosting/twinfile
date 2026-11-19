import { ProcessorGraph } from '../processor-graph.js';
import { createPatchMessageBus, type PatchMessageBus } from '../patch-message-bus.js';
import { validateEventMessageTarget } from '../validate-event-message.js';
import type { PatchNodeHandler, PatchProgramBuiltInput, PatchTrace, PatchTraceEntry } from '../../types/patch-program.js';
import type { TwinMessageV1 } from '../../types/twin-message.js';
import type { Result } from '../../types/twin-error.js';
import type { TwinError } from '../../types/twin-error.js';
import { ok } from '../../types/twin-error.js';
import { PatchContext } from './patch-context.js';
import { PatchGraphModel } from './patch-graph-model.js';
import { routeOneHop } from './patch-router.js';

export class PatchProgram {
  readonly graph: PatchGraphModel;
  readonly bus: PatchMessageBus;
  readonly place: Record<string, unknown>;
  readonly events: Record<string, unknown>[];
  private handlers = new Map<string, PatchNodeHandler>();
  private seq = 0;

  constructor(
    graph: PatchGraphModel,
    place: Record<string, unknown>,
    options: { bus?: PatchMessageBus; events?: Record<string, unknown>[] } = {},
  ) {
    this.graph = graph;
    this.bus = options.bus ?? createPatchMessageBus();
    this.place = place;
    this.events = options.events ?? [];
  }

  static fromBuilt(input: PatchProgramBuiltInput, bus?: PatchMessageBus): PatchProgram | undefined {
    const graphV1 = ProcessorGraph.parseTwinfile(input.twinfile)?.graph;
    if (!graphV1) return undefined;
    return new PatchProgram(new PatchGraphModel(graphV1), input.place, {
      bus,
      events: input.events,
    });
  }

  setHandler(moduleId: string, handler: PatchNodeHandler): void {
    this.handlers.set(moduleId, handler);
  }

  publish(message: TwinMessageV1): Result<PatchTraceEntry, TwinError[]> {
    if (message.wire === 'twin:event' && message.to) {
      const v = validateEventMessageTarget(this.graph.raw, message);
      if (!v.ok) return v as Result<PatchTraceEntry, TwinError[]>;
    }
    this.seq += 1;
    const stamped = { ...message, seq: message.seq ?? this.seq };
    this.bus.publish(stamped);
    const entry: PatchTraceEntry = { seq: stamped.seq ?? this.seq, at: stamped.at, message: stamped };
    return ok(entry);
  }

  route(message: TwinMessageV1, cuts?: Set<string>): TwinMessageV1[] {
    return routeOneHop(this.graph, this.bus, message, cuts, this.handlers);
  }

  curry(context: PatchContext): CurriedPatchProgram {
    return new CurriedPatchProgram(this, context);
  }

  eventHeadsByRef(): Map<string, Record<string, unknown>> {
    const map = new Map<string, Record<string, unknown>>();
    for (const head of this.events) {
      const id = typeof head.id === 'string' ? head.id : '';
      if (id) {
        map.set(id, head);
        const ver = typeof head.version === 'string' ? head.version : '0.0.0';
        map.set(`twinfile/event/${id}:${ver}`, head);
      }
    }
    return map;
  }
}

export class CurriedPatchProgram {
  readonly program: PatchProgram;
  readonly context: PatchContext;

  constructor(program: PatchProgram, context: PatchContext) {
    this.program = program;
    this.context = context;
  }

  flush(): PatchTrace {
    const entries: PatchTraceEntry[] = [];
    let seq = 0;

    const push = (message: TwinMessageV1) => {
      seq += 1;
      const stamped = { ...message, seq };
      this.program.bus.publish(stamped);
      entries.push({ seq, at: stamped.at, message: stamped });
      this.program.route(stamped, this.context.cuts);
    };

    for (const feed of this.context.feeds) {
      push(feed.toMessage());
    }

    for (const pulse of this.context.eventPulses(this.program.eventHeadsByRef())) {
      const built = pulse.pulse === 'long' ? pulse.pair() : pulse.enter();
      if (!built.ok) continue;
      const batch = Array.isArray(built.value) ? built.value : [built.value];
      for (const msg of batch) {
        push(msg);
      }
    }

    return { entries };
  }
}
