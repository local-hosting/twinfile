import { describe, expect, it } from 'vitest';

import { placeStateIo } from '../../src/workbench/viewer/public/viewer-place-state-io.js';

describe('viewer place state io', () => {
  it('keeps signal hub columns and drops plan controls', () => {
    const { inputs, outputs } = placeStateIo({
      inputs: [
        { id: 'signal:rain', label: 'Rain', kind: 'signal:rain' },
        { id: 'control.transit-disruption', label: 'Transit disruption', kind: 'control' },
        { id: 'context-signals.trigger', label: 'Trigger', kind: 'signal:trigger' },
      ],
      outputs: [
        { id: 'signal:occupancy', label: 'Occupancy', kind: 'signal:occupancy' },
        { id: 'signal:status', label: 'Status', kind: 'signal:status' },
      ],
    });
    expect(inputs.map((r) => r.id)).toEqual(['signal:rain']);
    expect(outputs.map((r) => r.id)).toEqual(['signal:occupancy', 'signal:status']);
  });
});
