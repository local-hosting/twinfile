import type { Job } from '../types/job.js';
import type { JobSituationModel } from '../types/job-situation-model.js';

/** Minimal Character persona + journey shape for job ranking (no `@doppler-group/twinfile-character/persona` dependency). */
export type PersonaJobRankingSourceV1 = {
  persona: {
    label: string;
    quote: string;
    segment: string;
    who?: string;
    mindset?: string;
    goals?: string[];
    frustrations?: string[];
    insights?: string[];
    jobIds?: string[];
  };
  journeys?: readonly {
    phases?: readonly {
      jobIds?: readonly string[];
      moments?: readonly { jobIds?: readonly string[] }[];
    }[];
  }[];
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter((token) => token.length > 1),
  );
}

function scoreTokenOverlap(query: string, corpus: string): number {
  const queryTokens = tokenSet(query);
  const corpusTokens = tokenSet(corpus);
  if (corpusTokens.size === 0 || queryTokens.size === 0) return 0;
  let hits = 0;
  for (const token of corpusTokens) {
    if (queryTokens.has(token)) hits += 1;
  }
  return hits / corpusTokens.size;
}

function personaCorpusText(character: PersonaJobRankingSourceV1): string {
  const persona = character.persona;
  return [
    persona.label,
    persona.who,
    persona.mindset,
    persona.quote,
    ...(persona.goals ?? []),
    ...(persona.frustrations ?? []),
    ...(persona.insights ?? []),
    persona.segment,
  ]
    .filter(Boolean)
    .join(' ');
}

function jobCorpusText(job: Job): string {
  return [job.id, job.text, job.shortText, job.when, job.want, job.so, job.persona, job.segment]
    .filter(Boolean)
    .join(' ');
}

function explicitJobIds(character: PersonaJobRankingSourceV1): Set<string> {
  const ids = new Set<string>();
  for (const id of character.persona.jobIds ?? []) {
    const trimmed = id.trim();
    if (trimmed) ids.add(trimmed);
  }
  for (const journey of character.journeys ?? []) {
    for (const phase of journey.phases ?? []) {
      for (const id of phase.jobIds ?? []) {
        const trimmed = id.trim();
        if (trimmed) ids.add(trimmed);
      }
      for (const moment of phase.moments ?? []) {
        for (const id of moment.jobIds ?? []) {
          const trimmed = id.trim();
          if (trimmed) ids.add(trimmed);
        }
      }
    }
  }
  return ids;
}

export type RankedJobForPersonaV1 = {
  job: Job;
  score: number;
  explicit: boolean;
};

/** Rank Situations jobs for a focal Character (explicit ids first, then token overlap with persona voice). */
export function rankJobsForPersona(
  character: PersonaJobRankingSourceV1,
  model: JobSituationModel,
  limit = 8,
): RankedJobForPersonaV1[] {
  const explicit = explicitJobIds(character);
  const corpus = personaCorpusText(character);
  const ranked = model.jobs.map((job) => {
    const isExplicit = explicit.has(job.id);
    const overlap = scoreTokenOverlap(corpus, jobCorpusText(job));
    const score = isExplicit ? 1 + overlap : overlap;
    return { job, score, explicit: isExplicit };
  });
  return ranked
    .filter((row) => row.score > 0 || row.explicit)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(limit, 1));
}
