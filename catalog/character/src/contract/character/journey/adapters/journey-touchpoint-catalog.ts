import { classifyTouchpointType } from '../touchpoint-type.js';
import type {
  CustomerJourneyPhase,
  TouchpointHeartDimension,
  TouchpointChannel,
  TouchpointDefinition,
  TouchpointFunnelStage,
  TouchpointGraphSpec,
  TouchpointLink,
  TouchpointLocus,
  TouchpointModality,
  VisitorIntent,
  VisitationGoal,
  VisitationSubGoal,
} from '../touchpoints.schema.js';

import type { JourneyTouchpointRecord } from '../journey-touchpoint-catalog.schema.js';

export type { JourneyTouchpointRecord } from '../journey-touchpoint-catalog.schema.js';

export type JourneyTouchpointCatalog = Record<string, JourneyTouchpointRecord[]>;

export interface ImportJourneyTouchpointCatalogOptions {
  hubTouchpointId?: string;
  phaseForFile?: CustomerJourneyPhase;
}

const PHASE_BY_PREFIX: Record<string, CustomerJourneyPhase> = {
  A: 'pre_visit',
  Z: 'on_site',
  P: 'post_visit',
};

const HEART_BY_CATEGORY: Record<string, TouchpointHeartDimension> = {
  Adoption: 'adoption',
  Engagement: 'engagement',
  'Task Completion': 'task-success',
  Happiness: 'happiness',
  Retention: 'retention',
};

const FUNNEL_STAGE_MAP: Record<string, TouchpointFunnelStage> = {
  awareness: 'awareness',
  evaluation: 'evaluation',
  adoption: 'adoption',
  activation: 'activation',
  expansion: 'expansion',
  advocacy: 'advocacy',
};

const INTENT_SET = new Set<string>([
  'learn',
  'purchase',
  'upgrade',
  'setup',
  'fix',
  'switch',
  'rejoin',
  'downgrade',
  'cancel',
]);

function channelForRecord(record: JourneyTouchpointRecord): TouchpointChannel | undefined {
  return record.channel ?? record.context;
}

function phaseForZone(zone: string): CustomerJourneyPhase | undefined {
  const prefix = zone.trim().charAt(0);
  return PHASE_BY_PREFIX[prefix];
}

function modalityForRecord(
  record: JourneyTouchpointRecord,
): { modality: TouchpointModality; locus: TouchpointLocus } {
  const id = record.id.toLowerCase();
  if (id.includes('ar-') || id.includes('ar_')) {
    return { modality: 'ar', locus: 'blended' };
  }
  if (id.includes('vr')) return { modality: 'vr', locus: 'digital' };
  const channel = channelForRecord(record);
  if (channel === 'website') return { modality: 'web', locus: 'digital' };
  if (channel === 'social') return { modality: 'social', locus: 'digital' };
  if (channel === 'app') return { modality: 'mobile', locus: 'digital' };
  if (channel === 'map') return { modality: 'mobile', locus: 'digital' };
  if (classifyTouchpointType(record) === 'game') return { modality: 'game', locus: 'blended' };
  if (channel === 'media') {
    if (id.includes('stream')) return { modality: 'stream', locus: 'digital' };
    return { modality: 'broadcast', locus: 'digital' };
  }
  if (
    id.includes('kiosk') ||
    id.includes('screen') ||
    id.includes('signage') ||
    id.includes('digital')
  ) {
    return { modality: 'kiosk', locus: 'blended' };
  }
  if (channel === 'store') {
    return { modality: 'physical_space', locus: 'physical' };
  }
  return { modality: 'web', locus: 'digital' };
}

function goalsForIntents(intents: readonly string[]): {
  goals: VisitationGoal[];
  subGoals: VisitationSubGoal[];
} {
  const goals = new Set<VisitationGoal>();
  const subGoals = new Set<VisitationSubGoal>();

  for (const intent of intents) {
    if (intent === 'learn') {
      goals.add('consume');
      subGoals.add('learn');
    }
    if (intent === 'purchase' || intent === 'upgrade' || intent === 'switch') {
      goals.add('consume');
      subGoals.add('watch');
    }
    if (intent === 'setup' || intent === 'fix') {
      goals.add('contribute');
      subGoals.add('ideas');
    }
    if (intent === 'rejoin') {
      goals.add('connect');
      subGoals.add('friends');
    }
  }

  return { goals: [...goals], subGoals: [...subGoals] };
}

function mapRecord(
  record: JourneyTouchpointRecord,
  zone: string,
  phase: CustomerJourneyPhase | undefined,
): TouchpointDefinition {
  const { modality, locus } = modalityForRecord(record);
  const intents = (record.tags?.intents ?? []).filter((i): i is VisitorIntent =>
    INTENT_SET.has(i),
  );
  const { goals, subGoals } = goalsForIntents(intents);
  const funnelStages = (record.tags?.stages ?? [])
    .map((stage) => FUNNEL_STAGE_MAP[stage])
    .filter((stage): stage is TouchpointFunnelStage => Boolean(stage));

  return {
    id: record.id,
    label: record.name,
    type: classifyTouchpointType(record),
    modality,
    locus,
    channel: channelForRecord(record),
    journeyPhase: phase,
    zone,
    visitorIntents: intents.length > 0 ? intents : undefined,
    funnelStages: funnelStages.length > 0 ? funnelStages : undefined,
    goals: goals.length > 0 ? goals : undefined,
    subGoals: subGoals.length > 0 ? subGoals : undefined,
    durationWeight: record.duration,
    heartDimension:
      record.heartDimension ??
      (record.heartCategory ? HEART_BY_CATEGORY[record.heartCategory] : undefined),
    description: record.description,
    locationContext:
      phase === 'on_site'
        ? 'on_site'
        : phase === 'pre_visit'
          ? 'remote'
          : phase === 'post_visit'
            ? 'hybrid'
            : undefined,
    role:
      (record as { role?: TouchpointDefinition['role'] }).role ??
      (phase === 'on_site' && zone.includes('Entrance')
        ? 'hub'
        : phase === 'pre_visit' && zone.includes('Discovery')
          ? 'entry_point'
          : undefined),
  };
}

function sequentialLinks(touchpointIds: string[]): TouchpointLink[] {
  const links: TouchpointLink[] = [];
  for (let i = 0; i < touchpointIds.length - 1; i++) {
    links.push({
      fromTouchpointId: touchpointIds[i]!,
      toTouchpointId: touchpointIds[i + 1]!,
      transition: 'adjacent',
    });
  }
  return links;
}

/**
 * Import a zone-grouped journey touchpoint catalog into a TouchpointGraphSpec.
 * Consumer adapters pass client catalogs; this package stays brand-agnostic.
 */
export function importJourneyTouchpointCatalog(
  catalog: JourneyTouchpointCatalog,
  options: ImportJourneyTouchpointCatalogOptions = {},
): TouchpointGraphSpec {
  const touchpoints: TouchpointDefinition[] = [];
  const zoneOrder: string[] = [];

  for (const [zone, records] of Object.entries(catalog)) {
    zoneOrder.push(zone);
    const phase = options.phaseForFile ?? phaseForZone(zone);
    for (const record of records) {
      touchpoints.push(mapRecord(record, zone, phase));
    }
  }

  const links: TouchpointLink[] = [];
  const byZone = new Map<string, string[]>();
  for (const tp of touchpoints) {
    if (!tp.zone) continue;
    const list = byZone.get(tp.zone) ?? [];
    list.push(tp.id);
    byZone.set(tp.zone, list);
  }

  for (const ids of byZone.values()) {
    links.push(...sequentialLinks(ids));
  }

  for (let i = 0; i < zoneOrder.length - 1; i++) {
    const fromIds = byZone.get(zoneOrder[i]!) ?? [];
    const toIds = byZone.get(zoneOrder[i + 1]!) ?? [];
    if (fromIds.length > 0 && toIds.length > 0) {
      links.push({
        fromTouchpointId: fromIds[fromIds.length - 1]!,
        toTouchpointId: toIds[0]!,
        transition: 'connected',
        label: `Zone transition: ${zoneOrder[i]} → ${zoneOrder[i + 1]}`,
      });
    }
  }

  const hub =
    options.hubTouchpointId ??
    touchpoints.find((tp) => tp.role === 'hub')?.id ??
    touchpoints.find((tp) => tp.journeyPhase === 'on_site')?.id;

  return {
    hubTouchpointId: hub,
    touchpoints,
    links,
  };
}

export function mergeJourneyTouchpointCatalogs(
  catalogs: JourneyTouchpointCatalog[],
  options: ImportJourneyTouchpointCatalogOptions = {},
): TouchpointGraphSpec {
  const merged: JourneyTouchpointCatalog = {};
  for (const catalog of catalogs) {
    Object.assign(merged, catalog);
  }
  return importJourneyTouchpointCatalog(merged, options);
}
