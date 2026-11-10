import { describe, expect, it } from 'vitest';

import { compactHostIo } from '../../../src/catalog/place/place/compact-host-io.js';

describe('compactHostIo', () => {
  it('drops control inputs and sorts labels', () => {
    const compact = compactHostIo({
      inputs: [
        { id: 'b', label: 'Bravo', kind: 'signal:b' },
        { id: 'control.x', label: 'X', kind: 'control' },
        { id: 'a', label: 'Alpha', kind: 'signal:a' },
      ],
      outputs: [{ id: 'z', label: 'Zulu', kind: 'signal:z' }],
    });
    expect(compact.inputs.map((r) => r.label)).toEqual(['Alpha', 'Bravo']);
    expect(compact.outputs.map((r) => r.label)).toEqual(['Zulu']);
  });
});
