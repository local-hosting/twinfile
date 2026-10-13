import { describe, expect, it } from 'vitest';

import { labelFromSignalWire, sanitizeHostIo } from '../../../src/place/host-signal-ports.js';

describe('host signal port labels', () => {
  it('title-cases signal wire tails', () => {
    expect(labelFromSignalWire('signal:rain')).toBe('Rain');
    expect(labelFromSignalWire('signal:trigger')).toBe('Trigger');
    expect(labelFromSignalWire('place:merged')).toBe('Place snapshot');
    expect(labelFromSignalWire('signal:occupancy')).toBe('Occupancy');
  });

  it('strips plan controls from host io', () => {
    const io = sanitizeHostIo({
      inputs: [
        { id: 'signal:rain', label: 'Rain', kind: 'signal:rain' },
        { id: 'control.severe-weather', label: 'severe-weather', kind: 'control' },
        { id: 'context-signals.trigger', label: 'trigger', kind: 'signal:trigger' },
      ],
      outputs: [],
    });
    expect(io.inputs.map((r) => r.id)).toEqual(['signal:rain']);
  });
});
