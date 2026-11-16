import { describe, expect, it } from 'vitest';

import { titleFromRefId, twinfileDisplayName } from '../src/twinfile/display-name.js';

describe('twinfileDisplayName', () => {
  it('prefers manifest name over id', () => {
    expect(
      twinfileDisplayName({
        kind: 'scenario',
        id: 'coliving-wifi-expectations',
        name: 'Coliving Wi-Fi expectations',
      }),
    ).toBe('Coliving Wi-Fi expectations');
  });

  it('uses composed place site name for place twinfiles', () => {
    expect(
      twinfileDisplayName({ kind: 'place', id: 'arena' }, { place: { name: 'Example arena' } }),
    ).toBe('Example arena');
  });

  it('titleizes ref id when name omitted', () => {
    expect(twinfileDisplayName({ kind: 'situation', id: 'field-damage' })).toBe('Field Damage');
  });

  it('titleizes scenario id when name omitted', () => {
    expect(twinfileDisplayName({ kind: 'scenario', id: 'coliving-wifi-expectations' })).toBe(
      titleFromRefId('coliving-wifi-expectations'),
    );
  });
});
