import { z } from 'zod';

import type { StoryPlanExtractedHintsV1, StoryPlanExtractionIndexV1 } from '../types/story-plan.js';

const engagementLevelIdSchema = z.enum([
  'stranger',
  'explorer',
  'beginner',
  'regular',
  'champion',
  'rejoiner',
]);

export const storyPlanExtractedHintsSchema = z.object({
  scenarioSummary: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  goals: z.array(z.string().min(1)).optional(),
  jobIds: z.array(z.string().min(1)).optional(),
  constraints: z.array(z.string().min(1)).optional(),
  notes: z.string().optional(),
  segmentId: z.string().min(1).optional(),
  storeSlug: z.string().min(1).optional(),
  storeName: z.string().min(1).optional(),
  place: z.string().min(1).optional(),
  engagementLevelId: engagementLevelIdSchema.optional(),
  intentId: z.string().min(1).optional(),
  focusAreaId: z.string().min(1).optional(),
  interestIds: z.array(z.string().min(1)).optional(),
  characterId: z.string().min(1).optional(),
  storyId: z.string().min(1).optional(),
  placeRef: z.string().min(1).optional(),
  planningHorizonDays: z.number().int().min(42).max(56).optional(),
  visitDayOffset: z.number().int().min(0).max(55).optional(),
  useFeedCalendar: z.boolean().optional(),
});

/** System prompt for NL → {@link StoryPlanExtractedHintsV1} (locker supplies `planningIndex` JSON in the user turn). */
export const STORY_PLAN_EXTRACT_SYSTEM_PROMPT = [
  'You extract structured story-planning fields from a natural-language customer journey request.',
  'Use ONLY ids that appear in the provided planningIndex JSON.',
  'Read planningIndex.storyPlanningGuide when present — customer context from project Characters.',
  'Read planningIndex.segments[] (topic, needsSummary, intentIds) from project Characters to pick segmentId.',
  'When planningIndex.characters/stories are present, pick characterId and storyId when the user mentions a character or Story twin.',
  'Read planningIndex.contexts[] and planningIndex.characterContexts[] for Context twins and ranked jobIds — pick jobIds only from planningIndex.jobIds.',
  'When the user names a job in plain language, prefer characterContexts[].rankedJobIds for the chosen characterId.',
  'Use planningIndex.storyBlessings[] to relate storyId with focal characterId and optional contextId.',
  'For place, use planningIndex storeSlugs / fleet places (storeSlug, storeName) — do not invent place refs.',
  'Put desired outcomes in goals[] (plain language). Put channel/timing constraints in constraints[].',
  'If the user names a city or store but not a slug, set place and/or storeName — not a invented storeSlug.',
  'Infer engagementLevelId and intentId when clear; otherwise omit.',
  'Respond with ONE JSON object only (no markdown) using these optional keys:',
  'scenarioSummary, topic, goals, jobIds, constraints, notes, segmentId, storeSlug, storeName, place,',
  'engagementLevelId, intentId, focusAreaId, interestIds,',
  'characterId, storyId, placeRef, planningHorizonDays (42-56), visitDayOffset, useFeedCalendar.',
].join(' ');

export function buildStoryPlanExtractUserContent(request: string, index: StoryPlanExtractionIndexV1): string {
  const contextLines =
    index.contexts && index.contexts.length > 0
      ? [
          '## Context twins (summaries)',
          ...index.contexts.map(
            (row) =>
              `- ${row.contextId}: ${row.label} — ${row.context} (jobs: ${row.jobIds.slice(0, 8).join(', ')})`,
          ),
          '',
        ]
      : [];
  const rankedLines =
    index.characterContexts && index.characterContexts.length > 0
      ? [
          '## Ranked jobs per character',
          ...index.characterContexts.map(
            (row) =>
              `- ${row.characterId}${row.label ? ` (${row.label})` : ''}: ${row.rankedJobIds.join(', ')}`,
          ),
          '',
        ]
      : [];
  return [
    '## User request',
    request.trim(),
    '',
    ...contextLines,
    ...rankedLines,
    '## planningIndex (valid ids)',
    JSON.stringify(index, null, 2),
  ].join('\n');
}

export function parseStoryPlanExtractedHintsFromLlmJson(text: string): StoryPlanExtractedHintsV1 {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('LLM response did not contain a JSON object');
  }
  const parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown;
  return storyPlanExtractedHintsSchema.parse(parsed);
}

/** Drop extracted ids that are not present on the planning index. */
export function sanitizeStoryPlanExtractedHints(
  raw: StoryPlanExtractedHintsV1,
  index: StoryPlanExtractionIndexV1,
): StoryPlanExtractedHintsV1 {
  const out: StoryPlanExtractedHintsV1 = { ...raw };
  if (out.segmentId && !index.segmentIds.includes(out.segmentId)) {
    delete out.segmentId;
  }
  if (out.storeSlug && !index.storeSlugs.includes(out.storeSlug)) {
    delete out.storeSlug;
  }
  if (out.intentId && !index.intentIds.includes(out.intentId)) {
    delete out.intentId;
  }
  if (out.focusAreaId && !index.focusAreaIds.includes(out.focusAreaId)) {
    delete out.focusAreaId;
  }
  const menuCharacterIds = index.characters?.map((row) => row.characterId) ?? [];
  const characterIds = [...new Set([...index.characterIds, ...menuCharacterIds])];
  if (out.characterId && !characterIds.includes(out.characterId)) {
    delete out.characterId;
  }
  const menuStoryIds = index.stories?.map((row) => row.id) ?? [];
  const storyIds = [...new Set([...index.storyIds, ...menuStoryIds])];
  if (out.storyId && !storyIds.includes(out.storyId)) {
    delete out.storyId;
  }
  const mountedPlaceRefs = index.places?.map((row) => row.placeRef) ?? [];
  if (out.placeRef && mountedPlaceRefs.length > 0 && !mountedPlaceRefs.includes(out.placeRef)) {
    delete out.placeRef;
  }
  if (out.jobIds) {
    out.jobIds = out.jobIds.filter((id) => index.jobIds.includes(id));
  }
  if (out.engagementLevelId && !index.engagementLevelIds.includes(out.engagementLevelId)) {
    delete out.engagementLevelId;
  }
  return out;
}