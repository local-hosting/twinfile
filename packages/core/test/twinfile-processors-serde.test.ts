import { describe, expect, it } from 'vitest';

import { parseModuleGraphFromTwinfile } from '../src/patch/module-graph-twinfile.js';
import {
  applyProcessorGraphToTwinfile,
  twinfileProcessorsFromGraph,
  removeTwinfileProcessor,
  upsertTwinfileProcessor,
} from '../src/patch/twinfile-processors-serde.js';

describe('twinfileProcessorsFromGraph', () => {
  it('round-trips outlets on processors', () => {
    const twinfile = {
      processors: [
        {
          id: 'a',
          type: 'twinfile/mod.map-sink@0.1.0',
          outlets: [{ port: 'out', to: { processor: 'b', port: 'in' } }],
        },
        { id: 'b', type: 'twinfile/mod.map-sink@0.1.0' },
      ],
    };
    const graph = parseModuleGraphFromTwinfile(twinfile);
    expect(graph).toBeDefined();
    const rows = twinfileProcessorsFromGraph(graph!);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === 'a')?.outlets).toEqual([
      { port: 'out', to: { processor: 'b', port: 'in' } },
    ]);
    const next = applyProcessorGraphToTwinfile({ twinfile: 2 }, graph!);
    expect(next.processors).toEqual(rows);
    expect(next.connections).toBeUndefined();
  });

  it('upsert and remove processors', () => {
    const twinfile: Record<string, unknown> = { processors: [] };
    upsertTwinfileProcessor(twinfile, {
      id: 'x',
      type: 'twinfile/mod.map-sink@0.1.0',
    });
    expect((twinfile.processors as unknown[]).length).toBe(1);
    expect(removeTwinfileProcessor(twinfile, 'x')).toBe(true);
    expect(twinfile.processors).toBeUndefined();
  });
});
