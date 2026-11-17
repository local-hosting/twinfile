import { isThinStoryPlanScenario } from './scenario.js';

/** Whether pass-2 LLM scenario expansion should run after corpus-backed brief assembly. */
export function shouldExpandStoryPlanScenarioWithLlm(input: {
  useLlm: boolean;
  naturalLanguageRequest: string;
  expandScenarioFromRequest?: boolean;
  workingBrief: string;
}): boolean {
  if (!input.useLlm) {
    return false;
  }
  if (input.expandScenarioFromRequest === false) {
    return false;
  }
  if (input.naturalLanguageRequest.trim().length > 0) {
    return true;
  }
  return isThinStoryPlanScenario(input.workingBrief);
}