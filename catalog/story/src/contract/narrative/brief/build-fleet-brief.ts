import { briefSection, joinBriefSections } from './format-brief.js';
import type { BriefV1 } from './types.js';

export type FleetBriefMember = {
  slug: string;
  name?: string;
  geo?: { lat: number; lon: number; h3Cell?: string };
};

function formatStoreLine(member: FleetBriefMember): string {
  const place = member.name?.trim() || member.slug;
  const geo = member.geo;
  const geoPart =
    geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lon)
      ? ` — ${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}${geo.h3Cell ? ` (h3 ${geo.h3Cell})` : ''}`
      : '';
  return `\`${member.slug}\` ${place}${geoPart}`;
}

export type BuildFleetBriefInput = {
  members: readonly FleetBriefMember[];
  totalCount: number;
  /** When filtering, show how many matched vs catalog total. */
  matchedLabel?: string;
  sampleLimit?: number;
};

export function buildFleetBrief(input: BuildFleetBriefInput): BriefV1 {
  const limit = input.sampleLimit ?? 8;
  const withGeo = input.members.filter((m) => m.geo?.lat != null && m.geo?.lon != null).length;
  const summaryBullets = [
    `${input.totalCount} store(s) in org fleet`,
    ...(input.matchedLabel ? [input.matchedLabel] : []),
    `${withGeo} with resolved coordinates in this view`,
  ];
  const sample = input.members.slice(0, limit).map(formatStoreLine);
  if (input.members.length > limit) {
    sample.push(`… and ${input.members.length - limit} more in this result set`);
  }

  return joinBriefSections('Fleet brief', [
    briefSection('Summary', summaryBullets),
    briefSection(input.members.length <= limit ? 'Stores' : 'Sample stores', sample),
  ]);
}
