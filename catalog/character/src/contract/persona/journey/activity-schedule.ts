import type { CustomerCatalog } from '../people/customer/profile/customer.js';
import type { JtbdCatalog } from '@local-hosting/twinfile-character/jsm/catalog/jtbd.schema.js';
import {
  ActivityBlockSchema,
  ActivityScheduleCatalogSchema,
  DailyActivityScheduleSchema,
  type ActivityBlock,
  type ActivityScheduleCatalog,
  type DailyActivitySchedule,
} from './activity-schedule.schema.js';
import type { TouchpointGraphSpec } from './touchpoints.schema.js';
import type { UserJourneyCatalog } from './user-journey.schema.js';

export interface ActivityScheduleIssue {
  code:
    | 'overlap'
    | 'invalid_range'
    | 'empty'
    | 'unknown_opportunity'
    | 'unknown_touchpoint'
    | 'unknown_phase'
    | 'unknown_job'
    | 'duplicate_schedule_subject';
  message: string;
  activityId?: string;
  id?: string;
}

export function parseActivityBlock(input: unknown): ActivityBlock {
  return ActivityBlockSchema.parse(input);
}

export function parseDailyActivitySchedule(input: unknown): DailyActivitySchedule {
  return DailyActivityScheduleSchema.parse(input);
}

export function parseActivityScheduleCatalog(input: unknown): ActivityScheduleCatalog {
  return ActivityScheduleCatalogSchema.parse(input);
}

export function validateScheduleActivities(
  activities: readonly ActivityBlock[],
): ActivityScheduleIssue[] {
  if (activities.length === 0) {
    return [{ code: 'empty', message: 'Schedule has no activities' }];
  }

  const issues: ActivityScheduleIssue[] = [];
  const sorted = [...activities].sort((a, b) => a.startTime - b.startTime);

  for (const activity of sorted) {
    if (activity.endTime <= activity.startTime) {
      issues.push({
        code: 'invalid_range',
        activityId: activity.id,
        message: `Activity "${activity.id}" has invalid time range`,
      });
    }
  }

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (next.startTime < prev.endTime) {
      issues.push({
        code: 'overlap',
        activityId: next.id,
        message: `Activity "${next.id}" overlaps "${prev.id}"`,
      });
    }
  }

  return issues;
}

export interface ValidateActivityScheduleCatalogOptions {
  customerCatalog?: CustomerCatalog;
  jtbdCatalog?: JtbdCatalog;
  journeyCatalog?: UserJourneyCatalog;
  touchpointGraph?: TouchpointGraphSpec;
}

function phaseIdsFromJourneyCatalog(catalog: UserJourneyCatalog | undefined): Set<string> {
  const ids = new Set<string>();
  if (!catalog) return ids;
  for (const journey of catalog.journeys) {
    for (const phase of journey.phases) {
      ids.add(phase.id);
    }
  }
  return ids;
}

function touchpointIdsFromGraph(graph: TouchpointGraphSpec | undefined): Set<string> {
  if (!graph) return new Set();
  return new Set(graph.touchpoints.map((row) => row.id));
}

/** Validate intraday schedules and cross-catalog refs when bundle context is provided. */
export function validateActivityScheduleCatalog(
  catalog: ActivityScheduleCatalog,
  options: ValidateActivityScheduleCatalogOptions = {},
): { valid: boolean; issues: ActivityScheduleIssue[] } {
  const issues: ActivityScheduleIssue[] = [];
  const opportunityIds = new Set(
    options.customerCatalog?.opportunities.map((row) => row.id) ?? [],
  );
  const jobIds = new Set(options.jtbdCatalog?.jobs.map((row) => row.id) ?? []);
  const phaseIds = phaseIdsFromJourneyCatalog(options.journeyCatalog);
  const touchpointIds = touchpointIdsFromGraph(options.touchpointGraph);
  const seenSubjects = new Set<string>();

  for (const schedule of catalog.schedules) {
    const subjectKey = `${schedule.subjectId}:${schedule.dayIndex}`;
    if (seenSubjects.has(subjectKey)) {
      issues.push({
        code: 'duplicate_schedule_subject',
        id: schedule.subjectId,
        message: `Duplicate schedule for subject "${schedule.subjectId}" on day ${schedule.dayIndex}`,
      });
    }
    seenSubjects.add(subjectKey);

    issues.push(...validateScheduleActivities(schedule.activities));

    for (const activity of schedule.activities) {
      if (activity.opportunityId && opportunityIds.size > 0 && !opportunityIds.has(activity.opportunityId)) {
        issues.push({
          code: 'unknown_opportunity',
          activityId: activity.id,
          id: activity.opportunityId,
          message: `Activity "${activity.id}" references unknown opportunity "${activity.opportunityId}"`,
        });
      }
      if (activity.touchpointId && touchpointIds.size > 0 && !touchpointIds.has(activity.touchpointId)) {
        issues.push({
          code: 'unknown_touchpoint',
          activityId: activity.id,
          id: activity.touchpointId,
          message: `Activity "${activity.id}" references unknown touchpoint "${activity.touchpointId}"`,
        });
      }
      if (activity.journeyPhaseId && phaseIds.size > 0 && !phaseIds.has(activity.journeyPhaseId)) {
        issues.push({
          code: 'unknown_phase',
          activityId: activity.id,
          id: activity.journeyPhaseId,
          message: `Activity "${activity.id}" references unknown journey phase "${activity.journeyPhaseId}"`,
        });
      }
      if (activity.jobId && jobIds.size > 0 && !jobIds.has(activity.jobId)) {
        issues.push({
          code: 'unknown_job',
          activityId: activity.id,
          id: activity.jobId,
          message: `Activity "${activity.id}" references unknown job "${activity.jobId}"`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

export function resolveActivityAtHour(
  schedule: DailyActivitySchedule,
  hourOfDay: number,
): ActivityBlock | undefined {
  return schedule.activities.find(
    (activity) => hourOfDay >= activity.startTime && hourOfDay < activity.endTime,
  );
}
