import type { TwinfileUseMode } from '@local-hosting/twinfile-core';
import { parseInstant } from '../timeline/clock.js';
import { formatLocalDateTime } from '../timeline/scrub.js';
import type { PhaseStarts, TimelineSample, TrackDef } from '../types/twinfile-time.js';

export type PlaceNarrativeInput = {
  place: Record<string, unknown>;
  spaceId?: string;
  sample?: TimelineSample;
  /** Scenario unit (question, name). */
  scenario?: { name?: string; question?: string };
  /** Merged event manifests from `Place.data`. */
  events?: Record<string, unknown>[];
  phaseStarts?: PhaseStarts;
  /** Scenario args after resolution (from image meta). */
  resolvedArgs?: Record<string, unknown>;
  /** Narration lens; defaults to `sample.mode` when present. */
  viewMode?: TwinfileUseMode;
};

export type TrackReadingFact = {
  trackId: string;
  source: TrackDef['source'];
  role: 'model' | 'observed';
  value: number;
  known: number | null;
  unit?: string;
  label: string;
  knowledgeLag: boolean;
};

export type NarrativeSection = {
  id: 'place' | 'scenario' | 'event' | 'moment';
  title: string;
  bullets: string[];
  /** Same bullets joined — use {@link formatTwinMarkdown} for display. */
  paragraph: string;
  facts: Record<string, unknown>;
};

export type TwinNarrative = {
  spaceId?: string;
  sections: {
    place: NarrativeSection;
    scenario: NarrativeSection;
    event: NarrativeSection;
    moment?: NarrativeSection;
  };
  /** Markdown with `##` headings and `-` bullets. */
  markdown: string;
  paragraph: string;
  facts: {
    place: Record<string, unknown>;
    scenario: Record<string, unknown>;
    event: Record<string, unknown>;
    moment?: Record<string, unknown>;
  };
};

type SpaceRow = Record<string, unknown> & { id: string };

function siteMeta(place: Record<string, unknown>): Record<string, unknown> {
  const site = place.place;
  return site && typeof site === 'object' && !Array.isArray(site) ? (site as Record<string, unknown>) : {};
}

function spaceRow(place: Record<string, unknown>, spaceId: string): SpaceRow | undefined {
  const rows = place.spaces;
  if (!Array.isArray(rows)) return undefined;
  return (rows as SpaceRow[]).find((r) => r.id === spaceId);
}

function spaceLabel(row: SpaceRow): string {
  const name = typeof row.name === 'string' && row.name.trim() ? row.name : row.id;
  return name;
}

function exposurePhrase(exposure: unknown): string | undefined {
  if (exposure === 'indoor') return 'indoor';
  if (exposure === 'outdoor') return 'outdoor';
  if (exposure === 'covered') return 'covered outdoor';
  return undefined;
}

function tracksForSpace(place: Record<string, unknown>, spaceId: string): TrackDef[] {
  const tracks = (place.tracks ?? []) as TrackDef[];
  const sensors = (place.sensors ?? []) as Array<{ id?: string; space?: string; observes?: string }>;
  const sensorIds = new Set(
    sensors.filter((s) => s.space === spaceId || s.observes === spaceId).map((s) => String(s.id)),
  );
  return tracks.filter((t) => {
    if (t.source === 'coverage' && t.space === spaceId) return true;
    if (t.source === 'feed' && t.device && sensorIds.has(t.device)) return true;
    return false;
  });
}

function roundDisplay(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function trackReadingFact(track: TrackDef, sample: TimelineSample): TrackReadingFact | undefined {
  const value = sample.tracks[track.id];
  if (value === null || value === undefined) return undefined;
  const known = sample.known[track.id] ?? null;
  const unit = track.unit;
  const knowledgeLag = track.source === 'feed' && known !== value;

  if (track.source === 'coverage') {
    if (track.metric === 'rssi_dbm') {
      return {
        trackId: track.id,
        source: track.source,
        role: 'model',
        value,
        known,
        unit: unit ?? 'dBm',
        label: 'expected RSSI',
        knowledgeLag: false,
      };
    }
    const served = value >= 1;
    return {
      trackId: track.id,
      source: track.source,
      role: 'model',
      value,
      known,
      unit,
      label: served ? 'expected service' : 'no expected service',
      knowledgeLag: false,
    };
  }

  if (track.source === 'feed') {
    const prop = track.property ?? track.id;
    const pretty = prop === 'rssi_dbm' ? 'RSSI' : prop.replace(/_/g, ' ');
    return {
      trackId: track.id,
      source: track.source,
      role: 'observed',
      value,
      known,
      unit,
      label: pretty,
      knowledgeLag,
    };
  }

  return undefined;
}

function formatReadingPhrase(reading: TrackReadingFact): string {
  const unitSuffix = reading.unit ? ` ${reading.unit}` : '';
  if (reading.source === 'coverage' && reading.label === 'expected RSSI') {
    return `${reading.label} about ${roundDisplay(reading.value)}${unitSuffix}`;
  }
  if (reading.source === 'coverage') {
    return reading.label;
  }
  return `${reading.label} ${roundDisplay(reading.value)}${unitSuffix}`.trim();
}

function formatKnowledgeLag(reading: TrackReadingFact): string | undefined {
  if (!reading.knowledgeLag) return undefined;
  const unitSuffix = reading.unit ? ` ${reading.unit}` : '';
  const truth = `${roundDisplay(reading.value)}${unitSuffix}`;
  if (reading.known === null) {
    return `In the water, ${reading.label.toLowerCase()} was already ${truth}, but nothing at that strength had been reported yet.`;
  }
  return `In the water, ${reading.label.toLowerCase()} was ${truth}, but the latest reported value was ${roundDisplay(reading.known)}${unitSuffix}.`;
}

function occupancyInSpace(sample: TimelineSample, spaceId: string): string[] {
  return sample.occupancy
    .filter((o) => o.space === spaceId)
    .map((o) => o.schedule);
}

function visitBeatsInSpace(sample: TimelineSample, spaceId: string): string[] {
  return sample.visit_beats.filter((b) => b.space === spaceId).map((b) => `${b.kind}:${b.id}`);
}

function joinList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function probeSpaces(place: Record<string, unknown>): Set<string> {
  const out = new Set<string>();
  for (const row of (place.sensors ?? []) as Array<{ id?: string; space?: string }>) {
    if (typeof row.space === 'string' && row.id && /probe/i.test(row.id)) out.add(row.space);
  }
  return out;
}

function scenarioQuestionSentence(
  question: string | undefined,
  focusSpaceId: string | undefined,
  focusSpaceName: string | undefined,
  place: Record<string, unknown>,
): string | undefined {
  if (!question) return undefined;
  const probes = probeSpaces(place);
  if (
    focusSpaceId &&
    probes.size > 0 &&
    !probes.has(focusSpaceId) &&
    /\bprobe\b|\bdesk\b/i.test(question)
  ) {
    const probeSpaceId = [...probes][0]!;
    const probeRow = spaceRow(place, probeSpaceId);
    const probeName = probeRow ? spaceLabel(probeRow) : probeSpaceId;
    return `The scenario compares modeled coverage to a probe at ${probeName}; this narrative focuses on ${focusSpaceName ?? focusSpaceId}.`;
  }
  return `The scenario asks: ${question}`;
}

function momentLabel(sample: TimelineSample, timezone: string | undefined): { local?: string; iso: string; t: number } {
  const iso = sample.at;
  if (!timezone) return { iso, t: sample.t };
  try {
    const ms = parseInstant(iso, 'at');
    const local = formatLocalDateTime(ms, timezone);
    return { local: `${local} (${timezone})`, iso, t: sample.t };
  } catch {
    return { iso, t: sample.t };
  }
}

function eventSummaries(events: Record<string, unknown>[]): Array<{
  name: string;
  phases: string[];
  expects: string[];
}> {
  return events.map((s) => {
    const expectsRaw = s.expects;
    const expects =
      expectsRaw && typeof expectsRaw === 'object' && !Array.isArray(expectsRaw)
        ? Object.keys(expectsRaw as Record<string, unknown>)
        : [];
    return {
      name: String(s.name ?? 'event'),
      phases: Array.isArray(s.phases) ? s.phases.filter((p): p is string => typeof p === 'string') : [],
      expects,
    };
  });
}

function resolvedArgsForNarrative(resolved: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!resolved) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(resolved)) {
    if (key === 'unitRoot') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function formatResolvedArgsSentence(args: Record<string, unknown>): string {
  const parts = Object.entries(args).map(([k, v]) => `\`${k}=${String(v)}\``);
  return `Resolved args: ${parts.join(', ')}.`;
}

function makeSection(
  id: NarrativeSection['id'],
  title: string,
  bullets: string[],
  facts: Record<string, unknown>,
): NarrativeSection {
  return {
    id,
    title,
    bullets,
    paragraph: bullets.join(' '),
    facts,
  };
}

const SECTION_ORDER: Array<'place' | 'scenario' | 'event' | 'moment'> = [
  'place',
  'scenario',
  'event',
  'moment',
];

export function formatTwinMarkdown(sections: TwinNarrative['sections']): string {
  const chunks: string[] = [];
  for (const key of SECTION_ORDER) {
    const section = sections[key];
    if (!section) continue;
    chunks.push(`## ${section.title}`, '');
    for (const bullet of section.bullets) chunks.push(`- ${bullet}`);
    chunks.push('');
  }
  return `${chunks.join('\n').trimEnd()}\n`;
}

function phasesStartedAt(t: number, phaseStarts: PhaseStarts | undefined, phaseIds: string[]): string[] {
  if (!phaseStarts) return [];
  const started: string[] = [];
  for (const phase of phaseIds) {
    const start = phaseStarts[phase];
    if (start !== undefined && start <= t) started.push(phase);
  }
  return started;
}

export function buildPlaceNarrative(input: PlaceNarrativeInput): TwinNarrative {
  const viewMode: TwinfileUseMode = input.viewMode ?? input.sample?.mode ?? 'place';
  const site = siteMeta(input.place);
  const siteName =
    typeof site.name === 'string' && site.name.trim() ? site.name : (input.scenario?.name ?? 'This place');
  const archetype = typeof site.archetype === 'string' ? site.archetype : undefined;
  const timezone = typeof site.timezone === 'string' ? site.timezone : undefined;

  const spaces = input.place.spaces;
  if (input.spaceId && !spaceRow(input.place, input.spaceId)) {
    throw new Error(`unknown space "${input.spaceId}"`);
  }

  const resolvedSpaceId =
    input.spaceId ??
    (Array.isArray(spaces) && spaces.length > 0 ? String((spaces[0] as SpaceRow).id) : undefined);

  const row = resolvedSpaceId ? spaceRow(input.place, resolvedSpaceId) : undefined;

  const placeFacts: Record<string, unknown> = {
    site: { name: siteName, archetype, timezone },
    ...(resolvedSpaceId && row
      ? {
          space: {
            id: resolvedSpaceId,
            name: spaceLabel(row),
            kind: row.kind,
            exposure: row.exposure,
            level: row.level,
          },
        }
      : {}),
  };

  const placeBullets: string[] = [];
  let siteLead = siteName;
  if (archetype) siteLead += ` is modeled as a ${archetype.replace(/_/g, ' ')} site`;
  if (timezone) siteLead += ` (${timezone})`;
  siteLead += '.';
  placeBullets.push(siteLead);

  if (row && resolvedSpaceId) {
    let spaceSentence = `${spaceLabel(row)} is a ${String(row.kind ?? 'space').replace(/_/g, ' ')}`;
    const exp = exposurePhrase(row.exposure);
    if (exp) spaceSentence += ` (${exp})`;
    if (typeof row.level === 'string') spaceSentence += ` on level ${row.level}`;
    const roles = Array.isArray(row.roles) ? row.roles.filter((r): r is string => typeof r === 'string') : [];
    if (viewMode === 'place' && roles.length > 0) spaceSentence += ` Roles here: ${joinList(roles)}.`;
    spaceSentence += '.';
    placeBullets.push(spaceSentence);
  } else if (resolvedSpaceId && !row) {
    placeBullets.push(`Focus space id: \`${resolvedSpaceId}\`.`);
  }

  const events = input.events ?? [];
  const summaries = eventSummaries(events);
  const resolvedArgFacts = resolvedArgsForNarrative(input.resolvedArgs);

  const scenarioFacts: Record<string, unknown> = {
    ...(input.scenario?.name ? { name: input.scenario.name } : {}),
    ...(input.scenario?.question ? { question: input.scenario.question } : {}),
    ...(resolvedSpaceId ? { focusSpace: resolvedSpaceId } : {}),
    ...(resolvedArgFacts ? { resolvedArgs: resolvedArgFacts } : {}),
  };

  const scenarioBullets: string[] = [];
  const questionSentence = scenarioQuestionSentence(
    input.scenario?.question,
    resolvedSpaceId,
    row ? spaceLabel(row) : undefined,
    input.place,
  );
  if (questionSentence) {
    scenarioBullets.push(questionSentence);
  } else if (input.scenario?.name) {
    scenarioBullets.push(`Scenario **${input.scenario.name}** (no MCP test prompt for this run id).`);
  } else {
    scenarioBullets.push('No scenario is mounted; this describes the place twin only.');
  }
  if (resolvedArgFacts) {
    scenarioBullets.push(formatResolvedArgsSentence(resolvedArgFacts));
  }

  const eventFacts: Record<string, unknown> = {
    events: summaries,
    ...(input.phaseStarts ? { phaseStarts: input.phaseStarts } : {}),
  };

  const eventBullets: string[] = [];
  if (summaries.length > 0) {
    for (const summary of summaries) {
      let line = `**${summary.name}**`;
      if (summary.phases.length > 0) line += ` — phases: ${joinList(summary.phases)}`;
      if (summary.expects.length > 0) line += `; expects ${joinList(summary.expects)} on the place`;
      eventBullets.push(`${line}.`);
    }
    if (input.sample && input.phaseStarts) {
      const t = input.sample.t;
      for (const summary of summaries) {
        const started = phasesStartedAt(t, input.phaseStarts, summary.phases);
        if (started.length > 0) {
          eventBullets.push(
            `${summary.name}: phase${started.length === 1 ? '' : 's'} ${joinList(started)} ${started.length === 1 ? 'has' : 'have'} begun by this instant.`,
          );
        } else if (summary.phases.length > 0) {
          eventBullets.push(`${summary.name}: no declared phase has started yet at this instant.`);
        }
      }
    }
  } else {
    eventBullets.push('No event units are included in this built `Place`.');
  }

  let momentSection: NarrativeSection | undefined;
  let momentFacts: Record<string, unknown> | undefined;

  if (input.sample && resolvedSpaceId) {
    const moment = momentLabel(input.sample, timezone);
    momentFacts = { moment };
    const momentBullets: string[] = [];

    if (moment.local) {
      momentBullets.push(
        `At **${moment.local}**, ${moment.t === 0 ? 'at the start of the scenario' : `${moment.t} s into the scenario`}.`,
      );
    } else {
      momentBullets.push(`At **${moment.iso}**, ${moment.t} s into the scenario.`);
    }

    const occ = occupancyInSpace(input.sample, resolvedSpaceId);
    if (occ.length > 0) {
      momentFacts.activeSchedules = occ;
      momentBullets.push(`Schedules using this space are active: ${joinList(occ)}.`);
    }

    const beats = visitBeatsInSpace(input.sample, resolvedSpaceId);
    if (beats.length > 0) {
      momentFacts.visitBeats = beats;
      momentBullets.push(`Visit beats here include ${joinList(beats)}.`);
    }

    const relatedTracks = tracksForSpace(input.place, resolvedSpaceId);
    const readingFacts: TrackReadingFact[] = [];
    for (const track of relatedTracks) {
      const fact = trackReadingFact(track, input.sample);
      if (fact) readingFacts.push(fact);
    }

    if (readingFacts.length > 0) {
      momentFacts.trackReadings = readingFacts;
      const model = readingFacts.filter((r) => r.role === 'model');
      const observed = readingFacts.filter((r) => r.role === 'observed');
      if (model.length > 0) {
        momentBullets.push(`**Modeled:** ${joinList(model.map(formatReadingPhrase))}.`);
      }
      if (observed.length > 0) {
        momentBullets.push(`**Observed:** ${joinList(observed.map(formatReadingPhrase))}.`);
      }
      for (const reading of readingFacts) {
        const lag = formatKnowledgeLag(reading);
        if (lag) momentBullets.push(lag);
      }
    } else if (Object.keys(input.sample.tracks).length > 0) {
      const activeCount = input.sample.active.length;
      if (activeCount > 0) {
        momentBullets.push(
          `${activeCount} schedule${activeCount === 1 ? '' : 's'} run site-wide; none are tied to this space in occupancy.`,
        );
      }
    }

    momentSection = makeSection('moment', 'Now', momentBullets, momentFacts);
  } else if (!input.sample) {
    momentFacts = { clock: null };
  }

  const sections: TwinNarrative['sections'] = {
    place: makeSection('place', 'Place', placeBullets, placeFacts),
    scenario: makeSection('scenario', 'Scenario', scenarioBullets, scenarioFacts),
    event: makeSection('event', 'Event', eventBullets, eventFacts),
    ...(momentSection ? { moment: momentSection } : {}),
  };

  const markdown = formatTwinMarkdown(sections);

  return {
    spaceId: resolvedSpaceId,
    sections,
    markdown,
    paragraph: markdown,
    facts: {
      place: placeFacts,
      scenario: scenarioFacts,
      event: eventFacts,
      ...(momentFacts ? { moment: momentFacts } : {}),
    },
  };
}
