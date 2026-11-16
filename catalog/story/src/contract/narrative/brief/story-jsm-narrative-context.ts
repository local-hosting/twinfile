import type { Journey } from '@local-hosting/twinfile-character/pcm';
import { pickJobsByIds, rankJobsForPersona, type Job, type JobSituationModel } from '@local-hosting/twinfile-character/jsm';

import type { StoryBriefCharacterV1 } from './types.js';
import {
  collectJobIdsFromJourney,
  findJourneyTouchpointBinding,
} from './journey-touchpoint-binding.js';
import { humanizeStoryWireLabel } from './storyboard-scene-context.js';

export type StoryJsmJobNarrativeV1 = {
  id: string;
  label: string;
  when: string;
  want: string;
  so: string;
  obstacles: readonly string[];
};

export type StoryJsmNarrativeContextV1 = {
  situationPackLabel?: string;
  situationPackSituation?: string;
  rankedJobs: readonly StoryJsmJobNarrativeV1[];
  journeyJobIds: readonly string[];
  personaGoals: readonly string[];
  personaFrustrations: readonly string[];
  personaQuote?: string;
  journeyGoal?: string;
};

function jobToNarrative(job: Job): StoryJsmJobNarrativeV1 {
  return {
    id: job.id,
    label: job.shortText?.trim() || job.text?.trim() || humanizeStoryWireLabel(job.id),
    when: job.when.trim(),
    want: job.want.trim(),
    so: job.so.trim(),
    obstacles: (job.obstacles ?? []).map((row) => row.text.trim()).filter(Boolean),
  };
}

function uniqueJobNarratives(rows: readonly StoryJsmJobNarrativeV1[]): StoryJsmJobNarrativeV1[] {
  const byId = new Map<string, StoryJsmJobNarrativeV1>();
  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }
  return [...byId.values()];
}

export function resolveJobsForTouchpoint(input: {
  jsm?: JobSituationModel;
  journey?: Journey;
  touchpointId: string;
  personaJobIds?: readonly string[];
}): StoryJsmJobNarrativeV1[] {
  const binding = findJourneyTouchpointBinding(input.journey, input.touchpointId);
  const phaseJobIds = binding?.moment?.jobIds ?? binding?.phase.jobIds ?? [];
  const sceneJobIds = [...phaseJobIds, ...(input.personaJobIds ?? [])];
  if (!input.jsm || sceneJobIds.length === 0) {
    return [];
  }
  return pickJobsByIds(input.jsm, sceneJobIds).map(jobToNarrative);
}

export function buildStoryJsmNarrativeContext(input: {
  jsm?: JobSituationModel;
  journey?: Journey;
  character?: StoryBriefCharacterV1;
  personaGoals?: readonly string[];
  personaFrustrations?: readonly string[];
  personaQuote?: string;
  personaJobRankingSource?: Parameters<typeof rankJobsForPersona>[0];
}): StoryJsmNarrativeContextV1 {
  const journeyJobIds = collectJobIdsFromJourney(input.journey);
  const personaGoals = [
    ...(input.personaGoals ?? []),
    ...(input.character?.psychology?.traits ?? []),
  ]
    .map((row) => row.trim())
    .filter(Boolean);
  const personaFrustrations = (input.personaFrustrations ?? []).map((row) => row.trim()).filter(Boolean);

  let rankedJobs: StoryJsmJobNarrativeV1[] = [];
  if (input.jsm && input.personaJobRankingSource) {
    rankedJobs = rankJobsForPersona(input.personaJobRankingSource, input.jsm).map((row) =>
      jobToNarrative(row.job),
    );
  } else if (input.jsm) {
    const ids = uniqueJobNarratives(
      pickJobsByIds(input.jsm, journeyJobIds).map(jobToNarrative),
    );
    rankedJobs = ids;
  }

  if (input.jsm && journeyJobIds.length > 0) {
    const journeyJobs = pickJobsByIds(input.jsm, journeyJobIds).map(jobToNarrative);
    rankedJobs = uniqueJobNarratives([...rankedJobs, ...journeyJobs]);
  }

  return {
    situationPackLabel: input.jsm?.label?.trim(),
    situationPackSituation: input.jsm?.situation?.trim(),
    rankedJobs,
    journeyJobIds,
    personaGoals,
    personaFrustrations,
    personaQuote: input.personaQuote?.trim(),
    journeyGoal: input.journey?.journeyGoal?.trim(),
  };
}

export function formatJsmJobBullet(job: StoryJsmJobNarrativeV1): string {
  const obstacle =
    job.obstacles.length > 0 ? ` Friction: ${job.obstacles.slice(0, 2).join('; ')}.` : '';
  return `**${job.label}** — *When* ${job.when} *I want* ${job.want} *so* ${job.so}.${obstacle}`;
}
