import type { KpiDefinition, KpiRegistry } from '@local-hosting/twinfile-context/types/kpi-definition-wire.js';
import type {
  TouchpointDefinition,
  TouchpointGraphSpec,
  TouchpointLink,
  TouchpointModality,
  VisitationGoal,
  VisitationSubGoal,
} from './touchpoints.schema.js';

export interface TouchpointGraphIssue {
  code:
    | 'unknown_touchpoint'
    | 'unknown_hub'
    | 'unknown_parent'
    | 'duplicate_touchpoint'
    | 'self_link'
    | 'unknown_metric'
    | 'orphan_touchpoint';
  message: string;
  touchpointId?: string;
  metricId?: string;
}

export interface TouchpointGraphReport {
  valid: boolean;
  issues: TouchpointGraphIssue[];
}

function registryRows(
  registry: KpiRegistry | readonly KpiDefinition[],
): readonly KpiDefinition[] {
  if ('rows' in registry) return registry.rows;
  return registry;
}

/** Validate touchpoint graph structure and metric cross-references. */
export function validateTouchpointGraph(
  graph: TouchpointGraphSpec,
  registry?: readonly KpiDefinition[],
): TouchpointGraphReport {
  const issues: TouchpointGraphIssue[] = [];
  const ids = new Set<string>();

  for (const touchpoint of graph.touchpoints) {
    if (ids.has(touchpoint.id)) {
      issues.push({
        code: 'duplicate_touchpoint',
        message: `Duplicate touchpoint id "${touchpoint.id}"`,
        touchpointId: touchpoint.id,
      });
    }
    ids.add(touchpoint.id);
  }

  if (graph.hubTouchpointId && !ids.has(graph.hubTouchpointId)) {
    issues.push({
      code: 'unknown_hub',
      message: `Hub touchpoint "${graph.hubTouchpointId}" is not defined`,
      touchpointId: graph.hubTouchpointId,
    });
  }

  for (const touchpoint of graph.touchpoints) {
    if (
      touchpoint.parentTouchpointId &&
      !ids.has(touchpoint.parentTouchpointId)
    ) {
      issues.push({
        code: 'unknown_parent',
        message: `Parent touchpoint "${touchpoint.parentTouchpointId}" is not defined`,
        touchpointId: touchpoint.id,
      });
    }
  }

  const metricIds = registry
    ? new Set(registryRows(registry).map((row) => row.id))
    : undefined;

  for (const touchpoint of graph.touchpoints) {
    for (const metricId of touchpoint.linkedMetricIds ?? []) {
      if (metricIds && !metricIds.has(metricId)) {
        issues.push({
          code: 'unknown_metric',
          message: `Touchpoint "${touchpoint.id}" links unknown metric "${metricId}"`,
          touchpointId: touchpoint.id,
          metricId,
        });
      }
    }
  }

  for (const link of graph.links) {
    if (!ids.has(link.fromTouchpointId)) {
      issues.push({
        code: 'unknown_touchpoint',
        message: `Link source "${link.fromTouchpointId}" is not defined`,
        touchpointId: link.fromTouchpointId,
      });
    }
    if (!ids.has(link.toTouchpointId)) {
      issues.push({
        code: 'unknown_touchpoint',
        message: `Link target "${link.toTouchpointId}" is not defined`,
        touchpointId: link.toTouchpointId,
      });
    }
    if (link.fromTouchpointId === link.toTouchpointId) {
      issues.push({
        code: 'self_link',
        message: `Touchpoint "${link.fromTouchpointId}" links to itself`,
        touchpointId: link.fromTouchpointId,
      });
    }
  }

  const linked = new Set<string>();
  for (const link of graph.links) {
    linked.add(link.fromTouchpointId);
    linked.add(link.toTouchpointId);
  }
  if (graph.hubTouchpointId) linked.add(graph.hubTouchpointId);

  for (const touchpoint of graph.touchpoints) {
    if (touchpoint.parentTouchpointId) linked.add(touchpoint.parentTouchpointId);
    if (
      graph.links.length > 0 &&
      !linked.has(touchpoint.id) &&
      touchpoint.id !== graph.hubTouchpointId
    ) {
      issues.push({
        code: 'orphan_touchpoint',
        message: `Touchpoint "${touchpoint.id}" is not connected in the graph`,
        touchpointId: touchpoint.id,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export function touchpointsByModality(
  graph: TouchpointGraphSpec,
  modality: TouchpointModality,
): TouchpointDefinition[] {
  return graph.touchpoints.filter((tp) => tp.modality === modality);
}

export function touchpointsForGoal(
  graph: TouchpointGraphSpec,
  goal: VisitationGoal,
): TouchpointDefinition[] {
  return graph.touchpoints.filter((tp) => tp.goals?.includes(goal));
}

export function touchpointsForSubGoal(
  graph: TouchpointGraphSpec,
  subGoal: VisitationSubGoal,
): TouchpointDefinition[] {
  return graph.touchpoints.filter((tp) => tp.subGoals?.includes(subGoal));
}

export function linksFrom(
  graph: TouchpointGraphSpec,
  touchpointId: string,
): TouchpointLink[] {
  return graph.links.filter((link) => link.fromTouchpointId === touchpointId);
}

export function linksTo(
  graph: TouchpointGraphSpec,
  touchpointId: string,
): TouchpointLink[] {
  return graph.links.filter((link) => link.toTouchpointId === touchpointId);
}

/** Attach registry metrics to touchpoints via touchpointId tags. */
export function linkMetricsToTouchpoints(
  graph: TouchpointGraphSpec,
  registry: readonly KpiDefinition[],
): TouchpointGraphSpec {
  const metricsByTouchpoint = new Map<string, string[]>();
  for (const row of registry) {
    if (!row.touchpointId) continue;
    const existing = metricsByTouchpoint.get(row.touchpointId) ?? [];
    existing.push(row.id);
    metricsByTouchpoint.set(row.touchpointId, existing);
  }

  return {
    ...graph,
    touchpoints: graph.touchpoints.map((touchpoint) => ({
      ...touchpoint,
      linkedMetricIds: [
        ...new Set([
          ...(touchpoint.linkedMetricIds ?? []),
          ...(metricsByTouchpoint.get(touchpoint.id) ?? []),
        ]),
      ],
    })),
  };
}

export function metricsForTouchpoint(
  registry: KpiRegistry | readonly KpiDefinition[],
  touchpointId: string,
): KpiDefinition[] {
  return registryRows(registry).filter((row) => row.touchpointId === touchpointId);
}
