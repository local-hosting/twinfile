import { describe, expect, it } from 'vitest';

import { formatBuildLayerScope, formatBuildLayerStepLabel } from '../src/build/build-layer-label.js';

describe('build layer labels', () => {
  it('marks from: chain as inherited', () => {
    expect(formatBuildLayerScope('from/base-indoor-stack/patch/0/place')).toBe('inherited');
    expect(formatBuildLayerScope('patch/6/ai')).toBe('local');
  });

  it('labels inherited and local manifest steps', () => {
    expect(formatBuildLayerStepLabel('from/base-indoor-stack/patch/0/place')).toBe('Step 0 · place');
    expect(formatBuildLayerStepLabel('patch/6/ai')).toBe('Step 6 · ai');
    expect(formatBuildLayerStepLabel('patch/7/visits')).toBe('Step 7 · visits');
    expect(formatBuildLayerStepLabel('patch/2/spaces+openings')).toBe('Step 2 · spaces, openings');
  });

  it('labels copy, bind, and derived steps', () => {
    expect(formatBuildLayerStepLabel('copy/4')).toBe('Step 4 · copy');
    expect(formatBuildLayerStepLabel('copy/pavilion/patch/1/spaces')).toBe(
      'Copy pavilion · step 1 · spaces',
    );
    expect(formatBuildLayerStepLabel('copy/concourse')).toBe('Copy · concourse');
    expect(formatBuildLayerStepLabel('bind/transit-disruption')).toBe('Bind · transit-disruption');
    expect(formatBuildLayerStepLabel('axes')).toBe('Step · derive archetype');
  });

  it('labels v1 layer files', () => {
    expect(formatBuildLayerStepLabel('place/spaces.yaml')).toBe('Step · place/spaces.yaml');
  });
});
