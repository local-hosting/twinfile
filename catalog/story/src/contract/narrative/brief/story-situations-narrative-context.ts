import type { Journey } from '@doppler-group/twinfile-character/persona';
import {
  pickJobsByIds,
  rankJobsForPersona,
  type Job,
  type JobContextModel,
} from '@doppler-group/twinfile-context';

import type { StoryBriefCharacterV1 } from './types.js';
import {
  collectJobIdsFromJourney,
  findJourneyTouchpointBinding,
} from './journey-touchpoint-binding.js';
import { humanizeStoryWireLabel } from './storyboard-scene-context.js';

/** JTBD narrative row: context (situation) → goal (job/progress) → outcome (success). */
export type StorySituationsJobNarrativeV1 = {
  id: string;
  label: string;
  /** Situation. */
  context: string;
  /** Job / progress. */
  goal: string;
  /** Definition of success. */
  outcome: string;
  obstacles: readonly string[];
};

export type StorySituationsNarrativeContextV1 = {
  contextPackLabel?: string;
  /** Pack-level context (situation). */
  contextPackContext?: string;
  rankedJobs: readonly StorySituationsJobNarrativeV1[];
  journeyJobIds: readonly string[];
  personaGoals: readonly string[];
  personaFrustrations: readonly string[];
  personaQuote?: string;
  journeyGoal?: string;
};

function jobToNarrative(job: Job): StorySituationsJobNarrativeV1 {
  return {
    id: job.id,
    label: job.shortText?.trim() || job.text?.trim() || humanizeStoryWireLabel(job.id),
    context: job.context.trim(),
    goal: job.goal.trim(),
    outcome: job.outcome.trim(),
    obstacles: (job.obstacles ?? []).map((row) => row.text.trim()).filter(Boolean),
  };
}

function uniqueJobNarratives(rows: readonly StorySituationsJobNarrativeV1[]): StorySituationsJobNarrativeV1[] {
  const byId = new Map<string, StorySituationsJobNarrativeV1>();
  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }
  return [...byId.values()];
}

function resolveContextTwin(input: {
  context?: JobContextModel;
  /** @deprecated Prefer `context`. */
  situations?: JobContextModel;
}): JobContextModel | undefined {
  return input.context ?? input.situations;
}

export function resolveJobsForTouchpoint(input: {
  context?: JobContextModel;
  /** @deprecated Prefer `context`. */
  situations?: JobContextModel;
  journey?: Journey;
  touchpointId: string;
  personaJobIds?: readonly string[];
}): StorySituationsJobNarrativeV1[] {
  const contextTwin = resolveContextTwin(input);
  const binding = findJourneyTouchpointBinding(input.journey, input.touchpointId);
  const phaseJobIds = binding?.moment?.jobIds ?? binding?.phase.jobIds ?? [];
  const sceneJobIds = [...phaseJobIds, ...(input.personaJobIds ?? [])];
  if (!contextTwin || sceneJobIds.length === 0) {
    return [];
  }
  return pickJobsByIds(contextTwin, sceneJobIds).map(jobToNarrative);
}

export function buildStorySituationsNarrativeContext(input: {
  context?: JobContextModel;
  /** @deprecated Prefer `context`. */
  situations?: JobContextModel;
  journey?: Journey;
  character?: StoryBriefCharacterV1;
  personaGoals?: readonly string[];
  personaFrustrations?: readonly string[];
  personaQuote?: string;
  personaJobRankingSource?: Parameters<typeof rankJobsForPersona>[0];
}): StorySituationsNarrativeContextV1 {
  const journeyJobIds = collectJobIdsFromJourney(input.journey);
  const personaGoals = [
    ...(input.personaGoals ?? []),
    ...(input.character?.psychology?.traits ?? []),
  ]
    .map((row) => row.trim())
    .filter(Boolean);
  const personaFrustrations = (input.personaFrustrations ?? []).map((row) => row.trim()).filter(Boolean);

  const contextTwin = resolveContextTwin(input);

  let rankedJobs: StorySituationsJobNarrativeV1[] = [];
  if (contextTwin && input.personaJobRankingSource) {
    rankedJobs = rankJobsForPersona(input.personaJobRankingSource, contextTwin).map((row) =>
      jobToNarrative(row.job),
    );
  } else if (contextTwin) {
    const ids = uniqueJobNarratives(
      pickJobsByIds(contextTwin, journeyJobIds).map(jobToNarrative),
    );
    rankedJobs = ids;
  }

  if (contextTwin && journeyJobIds.length > 0) {
    const journeyJobs = pickJobsByIds(contextTwin, journeyJobIds).map(jobToNarrative);
    rankedJobs = uniqueJobNarratives([...rankedJobs, ...journeyJobs]);
  }

  return {
    contextPackLabel: contextTwin?.label?.trim(),
    contextPackContext: contextTwin?.context?.trim(),
    rankedJobs,
    journeyJobIds,
    personaGoals,
    personaFrustrations,
    personaQuote: input.personaQuote?.trim(),
    journeyGoal: input.journey?.journeyGoal?.trim(),
  };
}

export function formatSituationsJobBullet(job: StorySituationsJobNarrativeV1): string {
  const goal = job.goal.replace(/^(to\s+)/i, '');
  const without =
    job.obstacles.length > 0 ? ` without ${job.obstacles.slice(0, 2).join('; ')}` : '';
  return `**${job.label}** — When ${job.context}, I want to ${goal}, so I can ${job.outcome}${without}.`;
}
