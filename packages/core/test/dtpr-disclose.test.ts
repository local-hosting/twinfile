import { describe, expect, it } from 'vitest';

import { listDtprDisclosures } from '../src/dtpr/list-disclosures.js';

describe('DTPR disclosures', () => {
  it('lists sensors, ai, and assets that carry dtpr', () => {
    const rows = listDtprDisclosures({
      sensors: [{ id: 's1', dtpr: { datachain: 'https://example.com/s1' } }, { id: 's2' }],
      ai: [{ id: 'a1', name: 'Greeter', dtpr: { type: 'ai', elements: { affected: ['people'] } } }],
      assets: [{ id: 'k1', dtpr: { type: 'device', elements: { purpose: ['commerce'] } } }],
    });
    expect(rows.map((row) => `${row.collection}/${row.id}`)).toEqual(['sensors/s1', 'ai/a1', 'assets/k1']);
    expect(rows[1]?.name).toBe('Greeter');
  });
});
