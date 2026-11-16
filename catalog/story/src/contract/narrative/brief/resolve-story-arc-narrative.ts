import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { Journey } from '@doppler-group/twinfile-character/persona';
import { samePlaceRef } from '@doppler-group/twinfile-core/ref';
import type { Story } from '../types/story-narrative.js';
import { deriveEpisodeTimingFromJobs } from '../episode/derive-episode-timing-from-jobs.js';
import { humanizeStoryWireLabel, humanizeToken } from './storyboard-scene-context.js';
import {
  resolveStoryEpisodePresentation,
  type StoryEpisodePresentationV1,
} from './resolve-story-episode-presentation.js';
import { collectJobIdsFromJourney } from './journey-touchpoint-binding.js';
import type { StorySituationsNarrativeContextV1 } from './story-situations-narrative-context.js';

export function resolveStoryDenouementActLabel(story?: Story): string | undefined {
  const acts = story?.arcTemplate?.acts;
  if (!acts?.length) return undefined;
  const sorted = [...acts].sort((left, right) => left.order - right.order);
  const denouement =
    sorted.find((act) => /denouement|arrive|resolve|payoff/i.test(act.id)) ??
    sorted[sorted.length - 1];
  return denouement?.label?.trim() || humanizeToken(denouement?.id ?? '');
}

/** Primary on-site label from Story place mounts (not generic “store”). */
export function resolvePrimaryMomentPlaceLabel(input: {
  story?: Story;
  arc?: EpisodeArcV1;
  journey?: Journey;
}): string {
  const arc = input.arc;
  const onSiteIds = new Set(
    (arc?.touchpointSchedule ?? [])
      .filter((row) => row.phase === 'on_site')
      .map((row) => row.touchpointId.trim()),
  );
  if (onSiteIds.size === 0 && arc?.objectiveTouchpointIds?.length) {
    const last = arc.objectiveTouchpointIds[arc.objectiveTouchpointIds.length - 1]?.trim();
    if (last) onSiteIds.add(last);
  }

  const placeLabels: string[] = [];
  for (const scene of input.story?.scenes ?? []) {
    const hits = scene.touchpointIds?.some((id) => onSiteIds.has(id.trim()));
    if (!hits) continue;
    const mount = input.story?.places?.find((row) => samePlaceRef(row.placeRef, scene.placeRef));
    if (mount?.label?.trim()) {
      placeLabels.push(mount.label.trim());
    } else if (mount?.role?.trim()) {
      placeLabels.push(humanizeToken(mount.role.trim()));
    }
  }

  if (placeLabels.length > 0) {
    return [...new Set(placeLabels)].join(' / ');
  }

  const lastPhase = input.journey?.phases
    ? [...input.journey.phases].sort((a, b) => b.order - a.order)[0]
    : undefined;
  if (lastPhase?.label?.trim()) {
    return lastPhase.label.trim();
  }

  return 'the primary beat';
}

export function formatJobPursuitPhrase(input: {
  journey?: Journey;
  situationsNarrative?: StorySituationsNarrativeContextV1;
}): string {
  const jobLabels: string[] = [];
  for (const job of input.situationsNarrative?.rankedJobs.slice(0, 4) ?? []) {
    const title = job.label?.trim();
    if (title) jobLabels.push(title);
  }
  if (jobLabels.length === 0) {
    for (const jobId of collectJobIdsFromJourney(input.journey).slice(0, 4)) {
      jobLabels.push(humanizeStoryWireLabel(jobId));
    }
  }
  if (jobLabels.length === 0) {
    return 'the jobs wired on this journey';
  }
  if (jobLabels.length === 1) {
    return `**${jobLabels[0]}**`;
  }
  return jobLabels.map((label) => `**${label}**`).join(', then ');
}

export function resolveEffectiveEpisodeTiming(input: {
  journey?: Journey;
  story?: Story;
  arc?: EpisodeArcV1;
  journeyPace?: string;
  rankedJobCount?: number;
}): DerivedEpisodeTimingPresentation {
  const arc = input.arc ?? input.story?.episodeArc;
  const touchpointIds = arc?.objectiveTouchpointIds ?? [];
  const derived = deriveEpisodeTimingFromJobs({
    journey: input.journey,
    touchpointIds,
    journeyPace: input.journeyPace,
    rankedJobCount: input.rankedJobCount,
  });
  const presentation = resolveStoryEpisodePresentation({
    journey: input.journey,
    story: input.story,
    arc,
  });

  const useSession = presentation.mode === 'session' || derived.session;
  const planningHorizonDays = useSession
    ? 1
    : arc?.planningHorizonDays ?? derived.planningHorizonDays;
  const visitDayIndex = useSession ? 0 : arc?.visitDayIndex ?? derived.visitDayIndex;

  return {
    presentation,
    derived,
    planningHorizonDays,
    visitDayIndex,
    session: useSession,
    primaryMomentLabel: resolvePrimaryMomentPlaceLabel({
      story: input.story,
      arc,
      journey: input.journey,
    }),
    denouementLabel: resolveStoryDenouementActLabel(input.story),
  };
}

export type DerivedEpisodeTimingPresentation = {
  presentation: StoryEpisodePresentationV1;
  derived: ReturnType<typeof deriveEpisodeTimingFromJobs>;
  planningHorizonDays: number;
  visitDayIndex: number;
  session: boolean;
  primaryMomentLabel: string;
  denouementLabel?: string;
};

export function formatDirectorArcParagraph(input: {
  timing: DerivedEpisodeTimingPresentation;
  startLabel?: string;
  arc?: EpisodeArcV1;
  jobPursuit: string;
  lastTouchpointLabel?: string;
}): string {
  const { timing, startLabel, arc, jobPursuit, lastTouchpointLabel } = input;
  const startPhrase = startLabel ? `We open the timeline on ${startLabel}. ` : '';

  if (timing.session) {
    const ending = lastTouchpointLabel
      ? `The **denouement** lands on “${lastTouchpointLabel}”`
      : 'The **denouement** lands on the last beat';
    const place = timing.primaryMomentLabel;
    return (
      `${startPhrase}` +
      `This plays as **${timing.presentation.timeframeLabel}**—not a multi-week calendar. ` +
      `${jobPursuit} is the through-line; shoot the touchpoints in order as one pursuit arc. ` +
      `${ending} at **${place}**` +
      (timing.denouementLabel ? ` (${timing.denouementLabel}).` : '.')
    );
  }

  const horizon = timing.planningHorizonDays;
  const visit = timing.visitDayIndex;
  const preEnd = arc?.phases.pre_visit.endDayIndex ?? Math.max(0, visit - 1);
  const postStart = arc?.phases.post_visit.startDayIndex ?? visit + 1;
  const postEnd = arc?.phases.post_visit.endDayIndex ?? horizon - 1;
  const primary = timing.primaryMomentLabel;

  return (
    `${startPhrase}` +
    `Across **${horizon} days**, ${jobPursuit} structures the episode—build, pursue, then release. ` +
    `Act one (days 0–${preEnd}) is setup and repeated attempts. ` +
    `Day **${visit}** is the set-piece at **${primary}**—the place-mounted moment the audience waits for. ` +
    `Act three (days ${postStart}–${postEnd}) is **denouement**: did the jobs stick, and what changed afterward? ` +
    `The simulation clock can advance beat by beat; the script is the on-screen spine.`
  );
}

export function formatDirectorDenouementClosing(input: {
  timing: DerivedEpisodeTimingPresentation;
  lastTouchpointLabel?: string;
}): string | undefined {
  const act = input.timing.denouementLabel;
  const beat = input.lastTouchpointLabel;
  if (!act && !beat) return undefined;
  if (act && beat) {
    return `**Ending:** Play the **${act}** beat honestly on “${beat}”—resolve the pursuit, don’t rush the button.`;
  }
  if (act) {
    return `**Ending:** Honor the **${act}** act—let the last frame answer whether the jobs paid off.`;
  }
  return `**Ending:** Close on “${beat}”—that’s the payoff image.`;
}
