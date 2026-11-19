import { describe, expect, it } from 'vitest';

import {
  mcpPlaceWireUri,
  mcpRefKeyMismatch,
  parseMcpLayersUri,
  parseMcpPlaceRowUri,
  parseMcpPlaceWireUri,
} from '../../../src/mcp/mcp-uri.js';

const SHOP = 'twinfile/shop:0.2.0';

describe('mcp-uri', () => {
  it('builds ref-scoped place wire uri', () => {
    expect(mcpPlaceWireUri(SHOP)).toBe('twin://twinfile/shop:0.2.0/place');
  });

  it('parses scoped and legacy wire uris', () => {
    expect(parseMcpPlaceWireUri('twin://place')).toBe('legacy');
    expect(parseMcpPlaceWireUri(mcpPlaceWireUri(SHOP))).toEqual({ refKey: SHOP });
    expect(parseMcpPlaceWireUri('twin://twinfile/other:1.0.0/place')).toEqual({ refKey: 'twinfile/other:1.0.0' });
  });

  it('parses scoped and legacy row uris', () => {
    expect(parseMcpPlaceRowUri('twin://place/spaces/sales-floor')).toEqual({
      collection: 'spaces',
      id: 'sales-floor',
    });
    expect(parseMcpPlaceRowUri(`twin://${SHOP}/place/spaces/sales-floor`)).toEqual({
      refKey: SHOP,
      collection: 'spaces',
      id: 'sales-floor',
    });
  });

  it('parses scoped layers uri', () => {
    expect(parseMcpLayersUri('twin://layers')).toBe('legacy');
    expect(parseMcpLayersUri(`twin://${SHOP}/layers`)).toEqual({ refKey: SHOP });
  });

  it('detects ref mismatch', () => {
    expect(mcpRefKeyMismatch(undefined, SHOP)).toBeUndefined();
    expect(mcpRefKeyMismatch(SHOP, SHOP)).toBeUndefined();
    expect(mcpRefKeyMismatch('twinfile/arena:1.2.0', SHOP)).toMatch(/ref mismatch/);
  });
});
