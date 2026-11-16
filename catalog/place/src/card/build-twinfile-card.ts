import {
  archetypeForAxes,
  geotypeKindForSlug,
  placeAxesForSlug,
  placeDecorationsForSlug,
  placeLabelFromSlug,
  slugToAcronym,
  type PlaceArchetypeAxes,
  type PlaceAxes,
} from '@local-hosting/geotypes';

import { getPlaceArchetype, getPlaceAxes } from '../place/place-axes.js';
import type {
  BuildTwinfileSummaryInput,
  TwinfileSummaryAspect,
  TwinfileSummaryIoPort,
  TwinfileSummaryPlaceVisit,
} from '@local-hosting/twinfile-core';
import { PlaceType } from '../place/place-type.js';
import { regionNavFromTwinfile } from '../place/region-nav.js';
import { isRunComposeHead } from '@local-hosting/twinfile-core';
import { twinfileDisplayName, twinfileRefId } from '@local-hosting/twinfile-core';
import { sanitizeHostIo } from '../place/host-signal-ports.js';
import { finishTwinfileSummary } from './render-card-layout.js';

function manifestStr(twinfile: Record<string, unknown>, key: string): string | undefined {
  const v = twinfile[key];
  return typeof v === 'string' ? v : undefined;
}

function geotypeSlug(twinfile: Record<string, unknown>): string | undefined {
  const geotype = twinfile.geotype;
  if (!geotype || typeof geotype !== 'object' || Array.isArray(geotype)) return undefined;
  const primary = (geotype as { primary?: unknown }).primary;
  return typeof primary === 'string' ? primary : undefined;
}

function subtitleForUnit(twinfile: Record<string, unknown>): string | undefined {
  const slug = geotypeSlug(twinfile);
  return slug ? placeLabelFromSlug(slug) : undefined;
}

/** Composed place axes win over the geotype's defaults so every card surface agrees. */
function resolveCardAxes(slug: string | undefined, place?: Record<string, unknown>) {
  const slugAxes: PlaceAxes | undefined = (slug ? placeAxesForSlug(slug) : null) ?? undefined;
  const axes: PlaceArchetypeAxes | undefined = getPlaceAxes(place, undefined) ?? slugAxes;
  const archetype = getPlaceArchetype(place) ?? (slugAxes ? archetypeForAxes(slugAxes) : undefined);
  return { axes, archetype };
}

function iconForUnit(twinfile: Record<string, unknown>): string {
  const slug = geotypeSlug(twinfile);
  if (slug) {
    const acronym = slugToAcronym(slug);
    if (acronym) return acronym;
  }
  const name = manifestStr(twinfile, 'name') ?? 'TF';
  return name.slice(0, 3).toUpperCase();
}

function visitMomentsFromPlace(place?: Record<string, unknown>): TwinfileSummaryPlaceVisit[] {
  const visits = place?.visits;
  if (!Array.isArray(visits)) return [];
  return visits.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const visit = row as { id?: unknown; name?: unknown; space?: unknown };
    const id = typeof visit.id === 'string' ? visit.id : undefined;
    if (!id) return [];
    return [
      {
        id,
        label: typeof visit.name === 'string' ? visit.name : id,
        ...(typeof visit.space === 'string' ? { space: visit.space } : {}),
      },
    ];
  });
}

function visitInputs(place?: Record<string, unknown>): TwinfileSummaryIoPort[] {
  return visitMomentsFromPlace(place).map((visit) => ({
    id: visit.id,
    label: visit.label,
    kind: 'visit-moment',
    ...(visit.space ? { detail: visit.space } : {}),
  }));
}

function expectsIo(twinfile: Record<string, unknown>): TwinfileSummaryIoPort[] {
  const expects = twinfile.expects;
  if (!expects || typeof expects !== 'object' || Array.isArray(expects)) return [];
  const out: TwinfileSummaryIoPort[] = [];
  for (const [role, spec] of Object.entries(expects as Record<string, unknown>)) {
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) continue;
    const kind = String((spec as { kind?: unknown }).kind ?? 'row');
    const min = Number((spec as { min?: unknown }).min ?? 0);
    out.push({
      id: role,
      label: role,
      kind,
      detail: `min ${min}`,
    });
  }
  return out;
}

function argsIo(args: Record<string, unknown> | undefined): TwinfileSummaryIoPort[] {
  if (!args) return [];
  return Object.keys(args).map((key) => ({
    id: key,
    label: `Scenario arg \`${key}\``,
    kind: 'arg',
  }));
}

function runnerOutputs(twinfile: Record<string, unknown>): TwinfileSummaryIoPort[] {
  const use = twinfile.use;
  if (!use || typeof use !== 'object' || Array.isArray(use)) return [];
  const runner = String((use as { runner?: unknown }).runner ?? '');
  if (!runner) return [];
  const outs: TwinfileSummaryIoPort[] = [
    {
      id: 'runner.stdout',
      label: 'Runner stdout (JSON Lines)',
      kind: 'offline',
      detail: `ENTRYPOINT ${runner}`,
    },
  ];
  if (runner.includes('hydraulic')) {
    outs.push(
      { id: 'metric.shelter_overflow', label: 'Shelter headcount vs capacity', kind: 'metric' },
      { id: 'metric.resource_shortfall_*', label: 'Relief stock shortfalls', kind: 'metric' },
    );
  }
  if (runner.includes('compose')) {
    outs.push({ id: 'metric.*', label: 'Merged child runner metrics', kind: 'metric' });
  }
  return outs;
}

function placeGeotypeAspects(slug: string | undefined, place?: Record<string, unknown>): TwinfileSummaryAspect[] {
  const fixed: TwinfileSummaryAspect[] = [];
  const { axes, archetype } = resolveCardAxes(slug, place);
  if (archetype) {
    fixed.push({ id: 'archetype', label: 'Archetype', value: archetype });
  }
  if (axes) {
    fixed.push({ id: 'axes', label: 'Axes', value: `${axes.extent} · ${axes.vertical} · ${axes.movement}` });
  }
  if (slug) {
    const kind = geotypeKindForSlug(slug);
    if (kind) fixed.push({ id: 'geotype.kind', label: 'Geotype kind', value: kind });
  }
  return fixed;
}

/** Geotype scaffold hints, not composed state. */
function geotypeInitHintAspects(slug: string | undefined): TwinfileSummaryAspect[] {
  if (!slug) return [];
  const deco = placeDecorationsForSlug(slug);
  if (!deco) return [];
  const fixed: TwinfileSummaryAspect[] = [];
  if (deco.events.length) {
    fixed.push({
      id: 'events.geotype-hint',
      label: 'Geotype init hints (events)',
      value: deco.events.join(', '),
    });
  }
  if (deco.layers.length) {
    fixed.push({
      id: 'layers.geotype-hint',
      label: 'Geotype init hints (layers)',
      value: deco.layers.join(', '),
    });
  }
  return fixed;
}

function fixedForPlace(slug: string | undefined, place?: Record<string, unknown>): TwinfileSummaryAspect[] {
  return [...placeGeotypeAspects(slug, place), ...geotypeInitHintAspects(slug)];
}

function runPresetVariables(twinfile: Record<string, unknown>): TwinfileSummaryAspect[] {
  const variables: TwinfileSummaryAspect[] = [];
  const composeCount = (Array.isArray(twinfile.steps) ? twinfile.steps : []).filter(
    (row) => row && typeof row === 'object' && typeof (row as { copy?: unknown }).copy === 'string',
  ).length;
  if (composeCount > 0) {
    variables.push({ id: 'compose.count', label: 'Stacked units', value: composeCount });
  }
  if (twinfile.clock) variables.push({ id: 'clock', label: 'Scenario clock', value: true });
  return variables;
}

type SummaryRows = Pick<import('@local-hosting/twinfile-core').TwinfileSummaryV1, 'fixed' | 'variables'> &
  import('@local-hosting/twinfile-core').TwinfileSummaryV1['io'];

function scenarioSummaryRows(
  twinfile: Record<string, unknown>,
  input: BuildTwinfileSummaryInput,
  slug: string | undefined,
): SummaryRows {
  const fixed: TwinfileSummaryAspect[] = [...(slug ? fixedForPlace(slug, input.place) : [])];
  const args = input.resolvedArgs ?? (twinfile.args as Record<string, unknown> | undefined);
  return {
    fixed,
    variables: runPresetVariables(twinfile),
    inputs: [...argsIo(args), ...visitInputs(input.place)],
    outputs: [...runnerOutputs(twinfile)],
  };
}

/** Build {@link TwinfileSummaryV1} from manifest + optional merged bundle fields. */
function summaryUnitKind(input: BuildTwinfileSummaryInput): string {
  if (isRunComposeHead(input.twinfile)) return 'run';
  const catalogKind = manifestStr(input.twinfile, 'kind');
  if (catalogKind === 'event') return catalogKind;
  return 'place';
}

export function buildTwinfileSummary(
  input: BuildTwinfileSummaryInput,
): import('@local-hosting/twinfile-core').TwinfileSummaryV1 {
  const twinfile = input.twinfile;
  const kind = summaryUnitKind(input);
  const place = input.place;
  const slug = geotypeSlug(twinfile);

  const refId = twinfileRefId(twinfile) ?? 'unknown';
  const head = {
    kind,
    id: refId,
    name: twinfileDisplayName(twinfile, place),
    version: manifestStr(twinfile, 'version') ?? '0.0.0',
    ...(manifestStr(twinfile, 'stability') ? { stability: manifestStr(twinfile, 'stability') } : {}),
  };

  const subtitle = subtitleForUnit(twinfile);
  const header = {
    name: twinfileDisplayName(twinfile, place),
    ...(subtitle ? { subtitle } : {}),
    icon: iconForUnit(twinfile),
  };

  let fixed: TwinfileSummaryAspect[] = [];
  let variables: TwinfileSummaryAspect[] = [];
  const inputs: TwinfileSummaryIoPort[] = [];
  const outputs: TwinfileSummaryIoPort[] = [];

  switch (kind) {
    case 'place': {
      const placeType =
        PlaceType.fromJSON(input.placeType) ??
        PlaceType.fromBuilt({
          twinfile,
          place,
        });
      if (placeType) {
        const ptIo = sanitizeHostIo(placeType.toHostIo());
        inputs.push(...ptIo.inputs);
        outputs.push(...ptIo.outputs);
      }
      break;
    }
    case 'run':
    case 'scenario': {
      const rows = scenarioSummaryRows(twinfile, input, slug);
      fixed = rows.fixed;
      variables = rows.variables;
      inputs.push(...rows.inputs);
      outputs.push(...rows.outputs);
      break;
    }
    case 'event':
      fixed = [
        {
          id: 'phases',
          label: 'Phases',
          value: (twinfile.phases as string[] | undefined)?.join(' → ') ?? '',
        },
      ];
      inputs.push(...expectsIo(twinfile));
      inputs.push(...argsIo(twinfile.args as Record<string, unknown> | undefined));
      outputs.push({
        id: 'bind.roles',
        label: 'Event role map',
        kind: 'binding',
        detail: 'Embedded on built place as eventBindings (bindings/<event>.yaml or matched role tags)',
      });
      break;
    default:
      fixed = [{ id: 'kind', label: 'Manifest kind', value: kind }];
      break;
  }

  const regions =
    kind === 'place'
      ? regionNavFromTwinfile(twinfile).map((row) => ({
          id: row.id,
          ...(row.name ? { name: row.name } : {}),
        }))
      : [];
  return finishTwinfileSummary({
    schema: 'twinfile.summary.v1',
    digest: input.digest ?? null,
    head,
    header,
    fixed,
    variables,
    io: { inputs, outputs },
    ...(regions.length ? { regions } : {}),
  });
}
