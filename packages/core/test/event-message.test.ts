import { describe, expect, it } from 'vitest';

import { buildEventMessage } from '../src/patch/build-event-message.js';
import { connectPorts, patchCordId } from '../src/patch/processor-graph-edit.js';
import { PatchProgram } from '../src/patch/program/patch-program.js';
import { PatchContext } from '../src/patch/program/patch-context.js';
import { PatchGraphModel } from '../src/patch/program/patch-graph-model.js';
import { eventPulseHandler } from '../src/patch/program/event-pulse.js';

describe('buildEventMessage', () => {
  it('builds twin:event fast enter pulse', () => {
    const built = buildEventMessage({
      eventHead: { id: 'severe-weather', version: '0.1.0', phases: ['warning', 'all-clear'] },
      phase: 'warning',
      pulse: 'fast',
      edge: 'enter',
      at: 0,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) throw new Error('build failed');
    expect(built.value.wire).toBe('twin:event');
    expect(built.value.payload).toMatchObject({ phase: 'warning', edge: 'enter' });
  });
});

describe('PatchProgram event inputs', () => {
  it('routes event pulse through context-events to signal-hub', () => {
    const twinfile = {
      processors: [
        {
          id: 'context-events',
          type: 'twinfile/mod.event-in@0.1.0',
          outlets: [{ port: 'alert', to: { processor: 'context-signals', port: 'alert' } }],
        },
        { id: 'context-signals', type: 'twinfile/mod.signal-hub@0.1.0' },
      ],
    };
    const program = PatchProgram.fromBuilt({
      twinfile,
      place: {},
      events: [{ id: 'severe-weather', version: '0.1.0', phases: ['warning'] }],
    });
    expect(program).toBeDefined();
    if (!program) throw new Error('program missing');

    let alertSeen = 0;
    program.setHandler(
      'context-events',
      eventPulseHandler({ alertTo: { module: 'context-signals', port: 'alert' } }),
    );
    program.setHandler('context-signals', (_port, msg) => {
      if (msg.wire === 'signal:alert') alertSeen += 1;
      return [];
    });

    const ctx = new PatchContext({
      events: [
        {
          ref: 'severe-weather',
          enabled: true,
          phase: 'warning',
          pulse: 'fast',
          target: { module: 'context-events', port: 'in' },
        },
      ],
    });
    const trace = program.curry(ctx).flush();
    expect(trace.entries.length).toBeGreaterThan(0);
    expect(alertSeen).toBeGreaterThan(0);
  });

  it('connectPorts records a cord id', () => {
    const graph = {
      modules: [
        { id: 'a', type: 'twinfile/mod.event-in@0.1.0' },
        { id: 'b', type: 'twinfile/mod.signal-hub@0.1.0' },
      ],
      connections: [],
    };
    const next = connectPorts(graph, { module: 'a', port: 'alert' }, { module: 'b', port: 'alert' });
    expect(next.connections).toHaveLength(1);
    const conn = next.connections[0]!;
    expect(patchCordId(conn.from, conn.to)).toContain('a.alert');
  });
});
