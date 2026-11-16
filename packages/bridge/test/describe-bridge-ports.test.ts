import { describe, expect, it } from 'vitest';

import { describeBridgePorts, listBridgePortCatalogIds } from '../src/describe-bridge-ports.js';

describe('describeBridgePorts', () => {
  it('lists built-in bridge ids from spec catalog', () => {
    expect(listBridgePortCatalogIds()).toContain('gtfs');
  });

  it('returns gtfs import/export ports', () => {
    const ports = describeBridgePorts('gtfs');
    expect(ports?.source?.direction).toBe('in');
    expect(ports?.place?.direction).toBe('out');
  });
});
