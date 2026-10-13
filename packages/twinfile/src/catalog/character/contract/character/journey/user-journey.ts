import type { CustomerCatalog } from '../people/customer/profile/customer.js';
import type { JtbdCatalog } from '@local-hosting/twinfile/context/catalog/jtbd.schema.js';
import type { ObstacleCatalog } from '@local-hosting/twinfile/context/catalog/obstacles.schema.js';
import type { TouchpointGraphSpec } from './touchpoints.schema.js';
import type {
  CustomerJourney,
  CustomerJourneyCatalog,
  UserJourney,
  UserJourneyCatalog,
} from './user-journey.schema.js';
import {
  CustomerFamilyUserTypeIdSchema,
  CustomerJourneyCatalogSchema,
  CustomerJourneySchema,
  UserJourneyCatalogSchema,
  UserJourneySchema,
} from './user-journey.schema.js';

export interface JourneyIssue {
  code:
    | 'duplicate_phase_id'
    | 'duplicate_phase_order'
    | 'unknown_lifecycle_stage'
    | 'unknown_intent'
    | 'unknown_engagement_level'
    | 'unknown_opportunity'
    | 'unknown_touchpoint'
    | 'unknown_job'
    | 'unknown_obstacle'
    | 'unknown_pain_point'
    | 'user_type_mismatch'
    | 'job_journey_phase_mismatch';
  message: string;
  id?: string;
}

export interface JourneyReport {
  valid: boolean;
  issues: JourneyIssue[];
}

export interface ValidateUserJourneyOptions {
  customerCatalog?: CustomerCatalog;
  jtbdCatalog?: JtbdCatalog;
  obstacleCatalog?: ObstacleCatalog;
  touchpointGraph?: TouchpointGraphSpec;
}

export function parseUserJourney(input: unknown): UserJourney {
  return UserJourneySchema.parse(input);
}

export function parseCustomerJourney(input: unknown): CustomerJourney {
  return CustomerJourneySchema.parse(input);
}

export function parseUserJourneyCatalog(input: unknown): UserJourneyCatalog {
  return UserJourneyCatalogSchema.parse(input);
}

export function parseCustomerJourneyCatalog(input: unknown): CustomerJourneyCatalog {
  return CustomerJourneyCatalogSchema.parse(input);
}

export function isCustomerJourney(journey: UserJourney): journey is CustomerJourney {
  return CustomerFamilyUserTypeIdSchema.safeParse(journey.userTypeId).success;
}

function touchpointIdsFromSources(
  journey: UserJourney,
  touchpointGraph?: TouchpointGraphSpec,
): Set<string> | undefined {
  const graph = touchpointGraph ?? journey.touchpointGraph;
  if (!graph) return undefined;
  return new Set(graph.touchpoints.map((row) => row.id));
}

function addIssue(
  issues: JourneyIssue[],
  code: JourneyIssue['code'],
  message: string,
  id?: string,
): void {
  issues.push({ code, message, id });
}

function validateJobJourneyPhaseRefs(
  journey: UserJourney,
  jtbdCatalog: JtbdCatalog,
  issues: JourneyIssue[],
): void {
  const phaseJobIds = new Map<string, Set<string>>();
  for (const phase of journey.phases) {
    phaseJobIds.set(phase.id, new Set(phase.jobIds));
  }

  for (const job of jtbdCatalog.jobs) {
    for (const ref of job.journeyPhaseRefs ?? []) {
      if (ref.journeyId !== journey.id) continue;

      const jobsForPhase = phaseJobIds.get(ref.phaseId);
      if (!jobsForPhase) {
        addIssue(
          issues,
          'job_journey_phase_mismatch',
          `Job "${job.id}" references unknown phase "${ref.phaseId}" on journey "${journey.id}"`,
          job.id,
        );
        continue;
      }

      if (!jobsForPhase.has(job.id)) {
        addIssue(
          issues,
          'job_journey_phase_mismatch',
          `Job "${job.id}" references phase "${ref.phaseId}" but is not listed in phase.jobIds`,
          job.id,
        );
      }
    }
  }
}

/** Validate journey structure and cross-catalog associations. */
export function validateUserJourney(
  journey: UserJourney,
  options: ValidateUserJourneyOptions = {},
): JourneyReport {
  const parsed = UserJourneySchema.parse(journey);
  const issues: JourneyIssue[] = [];

  const phaseIds = new Set<string>();
  const phaseOrders = new Set<number>();

  for (const phase of parsed.phases) {
    if (phaseIds.has(phase.id)) {
      addIssue(issues, 'duplicate_phase_id', `Duplicate journey phase id "${phase.id}"`, phase.id);
    }
    phaseIds.add(phase.id);

    if (phaseOrders.has(phase.order)) {
      addIssue(
        issues,
        'duplicate_phase_order',
        `Duplicate journey phase order ${phase.order}`,
        String(phase.order),
      );
    }
    phaseOrders.add(phase.order);
  }

  const catalog = options.customerCatalog;
  if (catalog) {
    const lifecycleStageIds = new Set(catalog.lifecycleStages.map((row) => row.id));
    const intentIds = new Set(catalog.intents.map((row) => row.id));
    const engagementLevelIds = new Set(catalog.engagementLevels.map((row) => row.id));
    const opportunityIds = new Set(catalog.opportunities.map((row) => row.id));
    const painPointIds = new Set(catalog.painPoints.map((row) => row.id));
    const userType = catalog.userTypes.find((row) => row.id === parsed.userTypeId);

    if (!userType) {
      addIssue(
        issues,
        'user_type_mismatch',
        `Journey userTypeId "${parsed.userTypeId}" is not defined in customer catalog`,
        parsed.userTypeId,
      );
    }

    for (const phase of parsed.phases) {
      if (phase.lifecycleStageId && !lifecycleStageIds.has(phase.lifecycleStageId)) {
        addIssue(
          issues,
          'unknown_lifecycle_stage',
          `Unknown lifecycle stage "${phase.lifecycleStageId}" on phase "${phase.id}"`,
          phase.lifecycleStageId,
        );
      }

      for (const intentId of phase.intentIds) {
        if (!intentIds.has(intentId)) {
          addIssue(
            issues,
            'unknown_intent',
            `Unknown intent "${intentId}" on phase "${phase.id}"`,
            intentId,
          );
        }
      }

      for (const levelId of phase.engagementLevelIds) {
        if (!engagementLevelIds.has(levelId)) {
          addIssue(
            issues,
            'unknown_engagement_level',
            `Unknown engagement level "${levelId}" on phase "${phase.id}"`,
            levelId,
          );
        }
      }

      for (const opportunityId of phase.opportunityIds) {
        if (!opportunityIds.has(opportunityId)) {
          addIssue(
            issues,
            'unknown_opportunity',
            `Unknown opportunity "${opportunityId}" on phase "${phase.id}"`,
            opportunityId,
          );
        }
      }

      for (const painPointId of phase.painPointIds) {
        if (!painPointIds.has(painPointId)) {
          addIssue(
            issues,
            'unknown_pain_point',
            `Unknown pain point "${painPointId}" on phase "${phase.id}"`,
            painPointId,
          );
        }
      }
    }
  }

  const jobIds = options.jtbdCatalog
    ? new Set(options.jtbdCatalog.jobs.map((row) => row.id))
    : undefined;

  if (jobIds) {
    for (const phase of parsed.phases) {
      for (const jobId of phase.jobIds) {
        if (!jobIds.has(jobId)) {
          addIssue(
            issues,
            'unknown_job',
            `Unknown JTBD job "${jobId}" on phase "${phase.id}"`,
            jobId,
          );
        }
      }
    }
  }

  const catalogObstacleIds = options.obstacleCatalog
    ? new Set(options.obstacleCatalog.obstacles.map((row) => row.id))
    : undefined;

  if (catalogObstacleIds) {
    for (const phase of parsed.phases) {
      for (const obstacleId of phase.obstacleIds) {
        if (!catalogObstacleIds.has(obstacleId)) {
          addIssue(
            issues,
            'unknown_obstacle',
            `Unknown obstacle "${obstacleId}" on phase "${phase.id}"`,
            obstacleId,
          );
        }
      }
    }
  }

  const touchpointIds = touchpointIdsFromSources(parsed, options.touchpointGraph);
  if (touchpointIds) {
    for (const phase of parsed.phases) {
      for (const touchpointId of phase.touchpointIds) {
        if (!touchpointIds.has(touchpointId)) {
          addIssue(
            issues,
            'unknown_touchpoint',
            `Unknown touchpoint "${touchpointId}" on phase "${phase.id}"`,
            touchpointId,
          );
        }
      }
    }
  }

  if (options.jtbdCatalog) {
    validateJobJourneyPhaseRefs(parsed, options.jtbdCatalog, issues);
  }

  return { valid: issues.length === 0, issues };
}

/** Validate all journeys in a catalog. */
export function validateUserJourneyCatalog(
  catalog: UserJourneyCatalog,
  options: ValidateUserJourneyOptions = {},
): JourneyReport {
  const parsed = UserJourneyCatalogSchema.parse(catalog);
  const issues: JourneyIssue[] = [];

  for (const journey of parsed.journeys) {
    const report = validateUserJourney(journey, options);
    for (const issue of report.issues) {
      issues.push({
        ...issue,
        message: `[${journey.id}] ${issue.message}`,
        id: issue.id ?? journey.id,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
