import { describe, expect, it } from 'vitest';

import { checkProcessorGraph } from '../src/check/patch-graph.js';
import { ProcessorGraph } from '../src/patch/processor-graph.js';
import { tryConnectPorts } from '../src/patch/processor-graph-edit.js';

describe('checkProcessorGraph', () => {
  it('accepts valid binds and wire-compatible outlet', () => {
    const twinfile = {
      processors: [
        {
          id: 'b',
          type: 'twinfile/mod.bridge-import@0.1.0',
          outlets: [{ port: 'place', to: { processor: 'm', port: 'in' } }],
        },
        { id: 'm', type: 'twinfile/mod.map-sink@0.1.0' },
      ],
    };
    const place = {
      spaces: [{ id: 'lobby' }],
      assets: [],
    };
    const result = checkProcessorGraph(twinfile, place);
    expect(result.ok).toBe(true);
    const fromClass = ProcessorGraph.fromTwinfile(twinfile, place);
    expect(fromClass.ok).toBe(true);
    expect(fromClass.value.graph).toBeDefined();
  });

  it('accepts ref:building when manifest and merged space match', () => {
    const twinfile = {
      twinfile: 2,
      steps: [{ copy: './parts/hub', into: 'hub' }],
      processors: [
        {
          id: 'scope',
          type: 'twinfile/mod.building-scope@0.1.0',
          bind: { anchor: 'ref:building:hub' },
        },
      ],
    };
    const result = checkProcessorGraph(twinfile, { spaces: [{ id: 'hub' }, { id: 'hub-ticket-hall' }] });
    expect(result.ok).toBe(true);
  });

  it('rejects ref:building with no copy into that space', () => {
    const twinfile = {
      twinfile: 2,
      steps: [{ copy: './parts/hub', into: 'hub' }],
      processors: [
        {
          id: 'scope',
          type: 'twinfile/mod.building-scope@0.1.0',
          bind: { anchor: 'ref:building:other' },
        },
      ],
    };
    const result = checkProcessorGraph(twinfile, { spaces: [{ id: 'hub' }] });
    expect(result.ok).toBe(false);
  });

  it('accepts building-scope to map building port', () => {
    const twinfile = {
      twinfile: 2,
      steps: [{ copy: './parts/concourse', into: 'concourse' }],
      processors: [
        {
          id: 'scope',
          type: 'twinfile/mod.building-scope@0.1.0',
          bind: { anchor: 'ref:building:concourse' },
          outlets: [{ port: 'scoped', to: { processor: 'map', port: 'building' } }],
        },
        { id: 'map', type: 'twinfile/mod.map-sink@0.1.0' },
      ],
    };
    const result = checkProcessorGraph(twinfile, { spaces: [{ id: 'concourse' }] });
    expect(result.ok).toBe(true);
  });

  it('rejects unknown space bind', () => {
    const twinfile = {
      processors: [
        {
          id: 's',
          type: 'twinfile/mod.shelter-standup@0.1.0',
          bind: { focus: 'ref:space:missing' },
        },
      ],
    };
    const result = checkProcessorGraph(twinfile, { spaces: [] });
    expect(result.ok).toBe(false);
  });

  it('tryConnectPorts rejects wire mismatch', () => {
    const graph = {
      modules: [
        { id: 'b', type: 'twinfile/mod.bridge-import@0.1.0' },
        { id: 'm', type: 'twinfile/mod.map-sink@0.1.0' },
      ],
      connections: [],
    };
    const next = tryConnectPorts(graph, { module: 'b', port: 'source' }, { module: 'm', port: 'in' });
    expect(next.ok).toBe(false);
  });
});
