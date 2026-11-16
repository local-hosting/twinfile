import { describe, expect, it } from 'vitest';

import { storySceneResourceHintFindings } from '../src/views/audit/story-scene-resource-hints.js';

describe('storySceneResourceHintFindings', () => {
  it('warns when demo scene lacks device showcase', () => {
    const findings = storySceneResourceHintFindings(
      [{ id: 'store', label: 'Hands-on wearables demo at store' }],
      new Set<string>(),
    );
    expect(findings.some((f) => f.code === 'SCENE_PROP_HINT')).toBe(true);
  });

  it('is silent when showcase resource is linked', () => {
    const findings = storySceneResourceHintFindings(
      [{ id: 'store', label: 'Device demo' }],
      new Set(['spectrum-device-showcase']),
    );
    expect(findings.length).toBe(0);
  });
});