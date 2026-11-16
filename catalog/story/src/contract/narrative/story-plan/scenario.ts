import type {
  StoryPlanNarrativeContextV1,
  StoryPlanScenarioHintsV1,
} from '../types/story-plan.js';

export function isThinStoryPlanScenario(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 120) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length < 25;
}

function formatList(label: string, items: string[] | undefined): string | undefined {
  if (!items?.length) return undefined;
  return `${label}: ${items.join('; ')}`;
}

/** Build a planning brief from a short user hint + org narrative (no LLM). */
export function composeStoryPlanWorkingScenario(input: {
  hints: StoryPlanScenarioHintsV1;
  narrative: StoryPlanNarrativeContextV1;
}): string {
  const lines: string[] = [];
  const userLines = [
    input.hints.scenario?.trim(),
    input.hints.topic?.trim() ? `Topic: ${input.hints.topic.trim()}` : undefined,
    formatList('Goals', input.hints.goals),
    formatList('JTBD jobs (user-specified ids)', input.hints.jobIds),
    input.hints.storeName?.trim() ? `Store name hint: ${input.hints.storeName.trim()}` : undefined,
    input.hints.place?.trim() ? `Place hint: ${input.hints.place.trim()}` : undefined,
    input.hints.notes?.trim() ? `Notes: ${input.hints.notes.trim()}` : undefined,
  ].filter(Boolean) as string[];

  if (input.narrative.storyPlanningGuide?.trim()) {
    lines.push('## Org customer context (who they are, what they do)');
    lines.push(input.narrative.storyPlanningGuide.trim());
  }

  lines.push('', '## User hint');
  lines.push(
    userLines.length > 0
      ? userLines.join('\n')
      : 'Plan a customer journey episode grounded in org segment needs and objectives.',
  );

  if (input.narrative.segments.length > 1) {
    lines.push('', '## Org segments (match user need to psychology)');
    const maxSegments = 12;
    for (const segment of input.narrative.segments.slice(0, maxSegments)) {
      const title = segment.label ?? segment.topic ?? segment.id;
      lines.push(`### ${segment.id} — ${title}`);
      if (segment.topic && segment.topic !== title) {
        lines.push(`Topic: ${segment.topic}`);
      }
      if (segment.needsSummary) {
        lines.push(`Needs: ${segment.needsSummary}`);
      } else if (segment.overviewSummary) {
        lines.push(`Summary: ${segment.overviewSummary}`);
      }
      if (segment.suggestedIntentIds.length > 0) {
        lines.push(`Intents: ${segment.suggestedIntentIds.join(', ')}`);
      }
    }
  }

  const segmentId = input.hints.segmentId?.trim();
  const segment = segmentId
    ? input.narrative.segments.find((row) => row.id === segmentId)
    : undefined;

  if (segment) {
    lines.push('', `## Selected segment corpus: ${segment.id}`);
    if (segment.label) lines.push(`Label: ${segment.label}`);
    if (segment.topic) lines.push(`Topic: ${segment.topic}`);
    if (segment.needsSummary) lines.push(`Needs: ${segment.needsSummary}`);
    if (segment.overviewName) lines.push(`Archetype: ${segment.overviewName}`);
    if (segment.overviewSummary) lines.push(`Summary: ${segment.overviewSummary}`);
    if (segment.mindset) lines.push(`Mindset: ${segment.mindset}`);
    if (segment.journeyPace) lines.push(`Journey pace: ${segment.journeyPace}`);
    if (segment.primaryFocusAreaLabel || segment.primaryFocusAreaId) {
      lines.push(
        `Primary focus: ${segment.primaryFocusAreaLabel ?? segment.primaryFocusAreaId}`,
      );
    }
    if (segment.successFeeling) lines.push(`Success feeling: ${segment.successFeeling}`);
    if (segment.empathyPositive?.length) {
      lines.push(`Empathy (+): ${segment.empathyPositive.join('; ')}`);
    }
    if (segment.empathyNegative?.length) {
      lines.push(`Empathy (−): ${segment.empathyNegative.join('; ')}`);
    }
    if (segment.objectives.length > 0) {
      lines.push(
        'Objectives:',
        ...segment.objectives.map(
          (row) =>
            `  - intent \`${row.intentId}\` (engagement: ${row.validEngagementLevelIds.join(', ') || 'any'})`,
        ),
      );
    }
  }

  const storeSlug = input.hints.storeSlug?.trim();
  const store = storeSlug
    ? input.narrative.fleetPlaces.find((row) => row.slug === storeSlug)
    : undefined;

  if (store) {
    lines.push('', `## Place: ${store.slug}`);
    if (store.name) lines.push(`Store name: ${store.name}`);
    if (store.lat != null && store.lon != null) {
      lines.push(`Coordinates: ${store.lat}, ${store.lon}`);
    }
  }

  if (input.hints.engagementLevelId) {
    lines.push('', `Engagement override: ${input.hints.engagementLevelId}`);
  }
  if (input.hints.intentId) {
    lines.push(`Intent override: ${input.hints.intentId}`);
  }

  const requestedJobIds = input.hints.jobIds?.map((id) => id.trim()).filter(Boolean) ?? [];
  const jobsFromCatalog = input.narrative.jobsToBeDone;
  if (requestedJobIds.length > 0) {
    lines.push('', '## Jobs the user cares about (JTBD)');
    for (const jobId of requestedJobIds) {
      const job = jobsFromCatalog.find((row) => row.id === jobId);
      lines.push(
        job
          ? `- ${job.id}${job.label ? `: ${job.label}` : ''}`
          : `- ${jobId} (id not found in org JTBD catalog — pick closest from corpus)`,
      );
    }
  }
  const jobs = jobsFromCatalog.slice(0, 8);
  if (jobs.length > 0) {
    lines.push(
      '',
      '## JTBD (org sample)',
      ...jobs.map((row) => `- ${row.id}${row.label ? `: ${row.label}` : ''}`),
    );
  }

  if (input.narrative.touchpoints.length > 0) {
    lines.push(
      '',
      `## Touchpoints (sample of ${input.narrative.touchpoints.length})`,
      ...input.narrative.touchpoints.slice(0, 12).map(
        (row) =>
          `- ${row.id}${row.label ? ` (${row.label})` : ''}${row.journeyPhase ? ` [${row.journeyPhase}]` : ''}`,
      ),
    );
  }

  lines.push(
    '',
    '## Episode shape',
    `${input.narrative.planningDefaults.planningHorizonDays}-day horizon; ${input.narrative.planningDefaults.episodePhases}; feed calendar ${input.narrative.planningDefaults.useFeedCalendar ? 'on' : 'off'}.`,
  );

  return lines.join('\n');
}
