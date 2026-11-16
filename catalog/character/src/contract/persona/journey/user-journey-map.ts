import type { JtbdCatalog, JobDefinition } from '@local-hosting/twinfile-context/catalog/jtbd.schema.js';
import {
  JourneyMapJobEntrySchema,
  JourneyMapSchema,
  UserJourneyCatalogSchema,
  UserJourneyEngagementSchema,
  UserJourneyMapSchema,
  UserJourneySchema,
  type JourneyMap,
  type UserJourney,
  type UserJourneyCatalog,
  type UserJourneyEngagement,
  type UserJourneyMap,
  type UserJourneyPhase,
} from './user-journey.schema.js';

type JourneyIssue = {
  code:
    | 'unknown_phase'
    | 'unknown_journey'
    | 'engagement_user_type_mismatch'
    | string;
  message: string;
  id?: string;
};

type JourneyReport = { valid: boolean; issues: JourneyIssue[] };

function jobMapEntry(job: JobDefinition) {
  return JourneyMapJobEntrySchema.parse({
    id: job.id,
    label: job.label,
    context: job.context,
    goal: job.goal,
    outcome: job.outcome,
  });
}

function jobsByIdFromCatalog(jtbdCatalog?: JtbdCatalog): Map<string, JobDefinition> {
  return new Map((jtbdCatalog?.jobs ?? []).map((job) => [job.id, job]));
}

function resolvePhaseContext(journey: UserJourney, phase: UserJourneyPhase): string | undefined {
  return phase.context ?? journey.context ?? phase.description;
}

function mapJobsForPhase(phase: UserJourneyPhase, jobsById: Map<string, JobDefinition>) {
  const jobIds = [...phase.jobIds];
  const jobs = jobIds
    .map((jobId) => jobsById.get(jobId))
    .filter((job): job is JobDefinition => job != null)
    .map(jobMapEntry);
  return { jobIds, jobs };
}

function userTypeMatchesJourneyEngagement(
  journeyUserTypeId: UserJourney['userTypeId'],
  engagementUserTypeId: UserJourneyEngagement['userTypeId'],
): boolean {
  if (journeyUserTypeId === engagementUserTypeId) return true;
  return journeyUserTypeId === 'user';
}

function findPhase(journey: UserJourney, phaseId: string): UserJourneyPhase | undefined {
  return journey.phases.find((phase) => phase.id === phaseId);
}

function addIssue(issues: JourneyIssue[], code: JourneyIssue['code'], message: string, id?: string) {
  issues.push({ code, message, id });
}

export function buildJourneyMap(
  journey: UserJourney,
  options: { jtbdCatalog?: JtbdCatalog; currentPhaseId?: string } = {},
): JourneyMap {
  const parsed = UserJourneySchema.parse(journey);
  const jobsById = jobsByIdFromCatalog(options.jtbdCatalog);
  const currentPhaseId = options.currentPhaseId;
  const phases = parsed.phases.map((phase) => {
    const mappedJobs = mapJobsForPhase(phase, jobsById);
    return {
      phaseId: phase.id,
      label: phase.label,
      order: phase.order,
      goal: phase.goal,
      context: resolvePhaseContext(parsed, phase),
      touchpointIds: phase.touchpointIds,
      accomplishableJobIds: mappedJobs.jobIds,
      accomplishableJobs: mappedJobs.jobs,
      emotions: phase.emotions,
      active: currentPhaseId ? phase.id === currentPhaseId : undefined,
    };
  });
  const activePhase = currentPhaseId ? findPhase(parsed, currentPhaseId) : undefined;
  const activeJobs = activePhase
    ? mapJobsForPhase(activePhase, jobsById)
    : { jobIds: [], jobs: [] };
  return JourneyMapSchema.parse({
    journeyId: parsed.id,
    label: parsed.label,
    context: parsed.context,
    journeyGoal: parsed.journeyGoal,
    userTypeId: parsed.userTypeId,
    phases,
    currentPhaseId,
    activeAccomplishableJobIds: activeJobs.jobIds,
    activeAccomplishableJobs: activeJobs.jobs,
  });
}

export function resolveUserJourneyMap(
  engagement: UserJourneyEngagement,
  journeyCatalog: UserJourneyCatalog,
  options: { jtbdCatalog?: JtbdCatalog } = {},
): UserJourneyMap {
  const parsedEngagement = UserJourneyEngagementSchema.parse(engagement);
  const parsedCatalog = UserJourneyCatalogSchema.parse(journeyCatalog);
  const journeysById = new Map(parsedCatalog.journeys.map((row) => [row.id, row]));
  const jobsById = jobsByIdFromCatalog(options.jtbdCatalog);
  const journeyMaps: JourneyMap[] = [];
  const combinedJobIds = new Set<string>();

  for (const active of parsedEngagement.engagements) {
    const journey = journeysById.get(active.journeyId);
    if (!journey) {
      throw new Error(`Unknown journey "${active.journeyId}" in engagement`);
    }
    journeyMaps.push(
      buildJourneyMap(journey, { jtbdCatalog: options.jtbdCatalog, currentPhaseId: active.phaseId }),
    );
    const phase = findPhase(journey, active.phaseId);
    for (const jobId of phase?.jobIds ?? []) {
      combinedJobIds.add(jobId);
    }
  }

  const combinedAccomplishableJobs = [...combinedJobIds]
    .map((jobId) => jobsById.get(jobId))
    .filter((job): job is JobDefinition => job != null)
    .map(jobMapEntry);

  return UserJourneyMapSchema.parse({
    userTypeId: parsedEngagement.userTypeId,
    engagements: parsedEngagement.engagements,
    journeyMaps,
    combinedAccomplishableJobIds: [...combinedJobIds],
    combinedAccomplishableJobs,
  });
}

export function validateUserJourneyEngagement(
  engagement: UserJourneyEngagement,
  journeyCatalog: UserJourneyCatalog,
): JourneyReport {
  const parsedEngagement = UserJourneyEngagementSchema.parse(engagement);
  const parsedCatalog = UserJourneyCatalogSchema.parse(journeyCatalog);
  const issues: JourneyIssue[] = [];
  const journeysById = new Map(parsedCatalog.journeys.map((row) => [row.id, row]));

  for (const active of parsedEngagement.engagements) {
    const journey = journeysById.get(active.journeyId);
    if (!journey) {
      addIssue(
        issues,
        'unknown_journey',
        `Engagement references unknown journey "${active.journeyId}"`,
        active.journeyId,
      );
      continue;
    }
    if (!userTypeMatchesJourneyEngagement(journey.userTypeId, parsedEngagement.userTypeId)) {
      addIssue(
        issues,
        'engagement_user_type_mismatch',
        `Journey "${journey.id}" userTypeId "${journey.userTypeId}" does not match engagement userTypeId "${parsedEngagement.userTypeId}"`,
        journey.id,
      );
    }
    if (!findPhase(journey, active.phaseId)) {
      addIssue(
        issues,
        'unknown_phase',
        `Engagement references unknown phase "${active.phaseId}" on journey "${journey.id}"`,
        active.phaseId,
      );
    }
  }

  return { valid: issues.length === 0, issues };
}
