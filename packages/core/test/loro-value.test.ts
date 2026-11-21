import { describe, expect, it } from 'vitest';

import {
  compactForLoroStorage,
  prepareTwinfileLoroValue,
  renderTwinfileLoroView,
  stripMethodFieldsForLoro,
} from '../src/index.js';

describe('loro view', () => {
  it('strips method fields and empties for pack storage', () => {
    const body = {
      specVersion: '1.0',
      catalogId: 'demo',
      methodId: 'drop-me',
      method: { id: 'also-drop' },
      axm: { id: 'axm:1', strategy: {}, story: { title: 'Keep' } },
      emptyList: [],
      nested: { gone: undefined as unknown as string },
    };
    const prepared = prepareTwinfileLoroValue(body);
    expect(prepared.methodId).toBeUndefined();
    expect(prepared.method).toBeUndefined();
    expect(prepared.emptyList).toBeUndefined();
    expect(prepared.axm).toEqual({ id: 'axm:1', story: { title: 'Keep' } });
  });

  it('renderTwinfileLoroView returns clone-safe loro value', () => {
    const value = renderTwinfileLoroView({
      catalogId: 'demo',
      methodId: 'x',
      character: { id: 'persona:rider' },
    });
    expect(value).toEqual({ catalogId: 'demo', character: { id: 'persona:rider' } });
  });

  it('compact and strip are independently usable', () => {
    expect(compactForLoroStorage({ a: [], b: 1 })).toEqual({ b: 1 });
    expect(stripMethodFieldsForLoro({ methodId: 'm', keep: true })).toEqual({ keep: true });
  });

  it('can keep method fields when stripMethodFields is false', () => {
    const value = prepareTwinfileLoroValue(
      { methodId: 'keep-me', emptyList: [], ok: true },
      { stripMethodFields: false },
    );
    expect(value).toEqual({ methodId: 'keep-me', ok: true });
  });
});
