import { describe, expect, it } from 'vitest';
import { shouldExpandStoryPlanScenarioWithLlm } from '../../../src/contract/narrative/story-plan/should-expand-story-plan-scenario.js';

describe('shouldExpandStoryPlanScenarioWithLlm', () => {
  it('expands when NL request is present and useLlm', () => {
    expect(
      shouldExpandStoryPlanScenarioWithLlm({
        useLlm: true,
        naturalLanguageRequest: 'Plan a store visit for a comparison shopper',
        workingBrief: 'x'.repeat(400),
      }),
    ).toBe(true);
  });

  it('skips when expandScenarioFromRequest is false', () => {
    expect(
      shouldExpandStoryPlanScenarioWithLlm({
        useLlm: true,
        naturalLanguageRequest: 'Plan a visit',
        expandScenarioFromRequest: false,
        workingBrief: 'thin',
      }),
    ).toBe(false);
  });

  it('falls back to thin brief check when there is no NL request', () => {
    expect(
      shouldExpandStoryPlanScenarioWithLlm({
        useLlm: true,
        naturalLanguageRequest: '',
        workingBrief: 'short hint',
      }),
    ).toBe(true);
    expect(
      shouldExpandStoryPlanScenarioWithLlm({
        useLlm: true,
        naturalLanguageRequest: '',
        // ≥25 whitespace-separated tokens → not thin
        workingBrief: Array.from({ length: 40 }, (_, index) => `word${index}`).join(' '),
      }),
    ).toBe(false);
  });
});