import { describe, expect, it } from 'vitest';

import { createPatchMessageBus } from '../src/patch/patch-message-bus.js';
import type { TwinMessageV1 } from '../src/types/twin-message.js';

describe('createPatchMessageBus', () => {
  it('delivers to subscribed inlet', () => {
    const bus = createPatchMessageBus();
    const seen: TwinMessageV1[] = [];
    bus.subscribe({ module: 'map', port: 'in' }, (msg) => seen.push(msg));
    const message: TwinMessageV1 = {
      twinfile: 1,
      kind: 'message',
      v: 1,
      wire: 'place:merged',
      from: { module: 'feeds', port: 'place' },
      to: { module: 'map', port: 'in' },
      payload: { spaces: [] },
    };
    bus.publish(message);
    expect(seen).toEqual([message]);
  });
});
