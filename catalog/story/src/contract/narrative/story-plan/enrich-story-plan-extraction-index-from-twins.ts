import type { Character } from '@local-hosting/twinfile-character/character';
import {
  rankJobsForPersona,
  type JobContextModel,
  type PersonaJobRankingSourceV1,
} from '@local-hosting/twinfile-context';

import type { Story } from '../types/story-narrative.js';
import type {
  StoryPlanExtractionCharacterContextV1,
  StoryPlanExtractionContextBriefV1,
  StoryPlanExtractionIndexV1,
  StoryPlanExtractionStoryBlessV1,
} from '../types/story-plan.js';

function resolveTwinForMenuCharacter(
  characters: readonly Character[],
  characterId: string,
): Character | undefined {
  const id = characterId.trim();
  return characters.find((row) => row.id === id || row.persona?.id === id);
}

function rankedJobsForCharacter(twin: Character, model: JobContextModel, limit: number) {
  return rankJobsForPersona(twin as unknown as PersonaJobRankingSourceV1, model, limit);
}

function contextBriefFromModel(model: JobContextModel): StoryPlanExtractionContextBriefV1 {
  return {
    contextId: model.id,
    label: model.label,
    context: model.context,
    jobIds: model.jobs.map((job) => job.id),
    jobs: model.jobs.slice(0, 12).map((job) => ({
      id: job.id,
      goal: job.goal?.trim() || job.text?.trim() || job.id,
      outcome: job.outcome?.trim() || '',
    })),
  };
}

function mergeUniqueJobIds(...lists: readonly (readonly string[])[]): string[] {
  return [...new Set(lists.flat().map((id) => id.trim()).filter(Boolean))];
}

function pickContextForCharacter(
  contexts: readonly JobContextModel[],
  character: Character,
  blessings: readonly StoryPlanExtractionStoryBlessV1[],
): JobContextModel | undefined {
  const characterId = character.persona?.id?.trim() || character.id.trim();
  const bless = blessings.find((row) => row.characterId === characterId);
  if (bless?.contextId) {
    const matched = contexts.find((row) => row.id === bless.contextId);
    if (matched) return matched;
  }
  return contexts[0];
}

/**
 * Merge Context twins (`kind: context`) and ranked JTBD jobs into the LLM planning index
 * (hints must stay id-bounded). JTBD packs come from context mounts, not character bodies.
 */
export function enrichStoryPlanExtractionIndexFromProjectTwins(
  index: StoryPlanExtractionIndexV1,
  input: {
    characters: readonly Character[];
    contexts?: readonly JobContextModel[];
    stories?: readonly Story[];
    rankedJobLimit?: number;
  },
): StoryPlanExtractionIndexV1 {
  const limit = input.rankedJobLimit ?? 8;
  const contexts = input.contexts ?? [];
  const contextsById = new Map<string, StoryPlanExtractionContextBriefV1>();
  for (const model of contexts) {
    contextsById.set(model.id, contextBriefFromModel(model));
  }

  const characterContexts: StoryPlanExtractionCharacterContextV1[] = [];
  const storyBlessings: StoryPlanExtractionStoryBlessV1[] = [];
  const stories = input.stories ?? [];
  for (const menuStory of index.stories ?? []) {
    const storyTwin = stories.find((row) => row.id === menuStory.id);
    const focalId = storyTwin?.binding.characterId?.trim() || menuStory.focalCharacterId?.trim();
    if (!focalId) {
      continue;
    }
    storyBlessings.push({
      storyId: menuStory.id,
      characterId: focalId,
    });
  }

  const menuIds = new Set(
    (index.characters ?? []).map((row) => row.characterId.trim()).filter(Boolean),
  );
  for (const menuRow of index.characters ?? []) {
    const twin = resolveTwinForMenuCharacter(input.characters, menuRow.characterId);
    if (!twin || contexts.length === 0) {
      continue;
    }
    const contextTwin = pickContextForCharacter(contexts, twin, storyBlessings);
    if (!contextTwin) {
      continue;
    }
    const ranked = rankedJobsForCharacter(twin, contextTwin, limit);
    characterContexts.push({
      characterId: menuRow.characterId,
      label: menuRow.label,
      contextId: contextTwin.id,
      rankedJobIds: ranked.map((row) => row.job.id),
      rankedJobs: ranked.map((row) => ({
        id: row.job.id,
        label: row.job.goal?.trim() || row.job.text?.trim() || row.job.id,
      })),
    });
  }

  for (const twin of input.characters) {
    const id = twin.persona?.id?.trim() || twin.id.trim();
    if (menuIds.has(id) || contexts.length === 0) {
      continue;
    }
    const contextTwin = pickContextForCharacter(contexts, twin, storyBlessings);
    if (!contextTwin) {
      continue;
    }
    const ranked = rankedJobsForCharacter(twin, contextTwin, limit);
    characterContexts.push({
      characterId: id,
      label: twin.persona?.label?.trim() || twin.title?.trim(),
      contextId: contextTwin.id,
      rankedJobIds: ranked.map((row) => row.job.id),
      rankedJobs: ranked.map((row) => ({
        id: row.job.id,
        label: row.job.goal?.trim() || row.job.text?.trim() || row.job.id,
      })),
    });
  }

  const withContextIds = storyBlessings.map((bless) => {
    const match = characterContexts.find((row) => row.characterId === bless.characterId);
    return {
      ...bless,
      ...(match?.contextId ? { contextId: match.contextId } : {}),
    };
  });

  const contextJobIds = [...contextsById.values()].flatMap((row) => row.jobIds);

  return {
    ...index,
    ...(contextsById.size > 0 ? { contexts: [...contextsById.values()] } : {}),
    ...(characterContexts.length > 0 ? { characterContexts } : {}),
    ...(withContextIds.length > 0 ? { storyBlessings: withContextIds } : {}),
    jobIds: mergeUniqueJobIds(index.jobIds, contextJobIds),
  };
}
