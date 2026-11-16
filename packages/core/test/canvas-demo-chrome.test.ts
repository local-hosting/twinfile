import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { loadCanvasDemoChrome, loadCanvasDemoPack } from '../src/canvas/load-canvas-demo-chrome.js';

const twinfileRoot = fileURLToPath(new URL('../../..', import.meta.url));

describe('loadCanvasDemoChrome', () => {
  it('projects waterfront demo rows for unsigned canvas chrome', () => {
    const root = process.env.TF_TWINFILE_ROOT?.trim() || twinfileRoot;
    const pack = loadCanvasDemoPack(root);
    expect(pack.places).toContain('dunkirk-dock');

    const chrome = loadCanvasDemoChrome(root);
    expect(chrome.places.find((row) => row.id === 'dunkirk-dock')).toMatchObject({
      geo: '42.4795, -79.3337',
      slug: 'dunkirk-dock',
    });
    expect(chrome.resources.find((row) => row.id === 'dock-crane')).toMatchObject({
      geo: '42.4680, -79.3185',
    });
    expect(chrome.stories.find((row) => row.id === 'morning-crossing')).toMatchObject({
      personaId: 'ferry-captain',
      mapSlug: 'buffalo-harbor',
      storyPitch: 'Dawn ferry run from Dunkirk into Buffalo Harbor.',
    });
    expect(chrome.events.find((row) => row.id === 'harbor-berth')).toMatchObject({
      dayIndex: '1',
    });
    expect(chrome.storyEventIds['morning-crossing']).toEqual(['dawn-cast-off', 'harbor-berth']);
  });
});