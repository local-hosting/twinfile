import { describe, expect, it } from 'vitest';

import { buildSituationMessage } from '../src/patch/build-situation-message.js';
import { connectPorts, patchCordId } from '../src/patch/processor-graph-edit.js';
import { PatchProgram } from '../src/patch/program/patch-program.js';
import { PatchContext } from '../src/patch/program/patch-context.js';
import { PatchGraphModel } from '../src/patch/program/patch-graph-model.js';
import { situationPulseHandler } from '../src/patch/program/situation-pulse.js';

describe('buildSituationMessage', () => {
  it('builds twin:situation fast enter pulse', () => {
    const built = buildSituationMessage({
      situationHead: { id: 'severe-weather', version: '0.1.0', phases: ['warning', 'all-clear'] },
      phase: 'warning',
      pulse: 'fast',
      edge: 'enter',
      at: 0,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) throw new Error('build failed');
    expect(built.value.wire).toBe('twin:situation');
    expect(built.value.payload).toMatchObject({ phase: 'warning', edge: 'enter' });
  });
});

describe('PatchProgram situation inputs', () => {
  it('routes situation pulse through context-situations to signal-hub', () => {
    const twinfile = {
      processors: [
        {
          id: 'context-situations',
          type: 'twinfile/mod.situation-in@0.1.0',
          outlets: [{ port: 'alert', to: { processor: 'context-signals', port: 'alert' } }],
        },
        { id: 'context-signals', type: 'twinfile/mod.signal-hub@0.1.0' },
      ],
    };
    const program = PatchProgram.fromBuilt({
      twinfile,
      place: {},
      situations: [{ id: 'severe-weather', version: '0.1.0', phases: ['warning'] }],
    });
    expect(program).toBeDefined();
    if (!program) throw new Error('program missing');

    let alertSeen = 0;
    program.setHandler(
      'context-situations',
      situationPulseHandler({ alertTo: { module: 'context-signals', port: 'alert' } }),
    );
    program.setHandler('context-signals', (_port, msg) => {
      if (msg.wire === 'signal:alert') alertSeen += 1;
      return [];
    });

    const ctx = new PatchContext({
      situations: [
        {
          ref: 'severe-weather',
          enabled: true,
          phase: 'warning',
          pulse: 'fast',
          target: { module: 'context-situations', port: 'in' },
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
        { id: 'a', type: 'twinfile/mod.situation-in@0.1.0' },
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
