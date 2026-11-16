import type { PCM } from '@doppler-group/twinfile-character/pcm';
import type { StoryBriefCharacterV1, StoryBriefSnapshotV1 } from './types.js';

function humanizeToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function humanizeStoryWireLabel(raw: string | undefined): string {
  const id = raw?.trim();
  if (!id) return '';
  let leaf = id.includes(':') ? id.split(':').pop() ?? id : id;
  leaf = leaf.replace(/^(rider|driver|guest|shopper)-/i, '');
  return humanizeToken(leaf);
}

/** Storage keys and instance slugs — not cast-facing names. */
export function isTechnicalStoryIdentityLabel(value: string | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('persona:')) return false;
  if (trimmed.startsWith('did:')) return true;
  if (/^[a-z0-9]+(-[a-z0-9]+){2,}$/i.test(trimmed)) return true;
  if (/^(rider|driver|character|story)-/i.test(trimmed)) return true;
  if (!trimmed.includes(' ') && trimmed.includes('-') && trimmed === trimmed.toLowerCase()) {
    return true;
  }
  return false;
}

function exemplarNameFromPcm(pcm: PCM | undefined): string | undefined {
  const name = pcm?.persona.exemplar?.name?.trim();
  return name || undefined;
}

function personaLabelFromPcm(pcm: PCM | undefined): string | undefined {
  const label = pcm?.persona.label?.trim();
  if (!label || isTechnicalStoryIdentityLabel(label)) return undefined;
  return label;
}

export function resolveHumanProtagonistName(input: {
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
  personaLabel?: string;
}): string {
  const { snapshot, character, personaLabel } = input;
  const candidates = [character?.name?.trim(), snapshot.who?.displayName?.trim(), personaLabel?.trim()];
  for (const candidate of candidates) {
    if (candidate && !isTechnicalStoryIdentityLabel(candidate)) {
      return candidate;
    }
  }
  const pcmId = snapshot.who?.pcmId?.trim() || character?.psychology?.pcmId?.trim();
  if (pcmId) {
    const fromPcmId = humanizeStoryWireLabel(pcmId);
    if (fromPcmId) return fromPcmId;
  }
  const personaId = snapshot.personaId?.trim() || character?.personaId?.trim();
  if (personaId && !isTechnicalStoryIdentityLabel(personaId)) {
    return humanizeStoryWireLabel(personaId) || personaId;
  }
  const storyId = snapshot.storyId?.trim();
  if (storyId) {
    return humanizeToken(storyId) || 'Our protagonist';
  }
  return 'Our protagonist';
}

export function resolveHumanProtagonistNameWithPcm(input: {
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
  focalPcm?: PCM;
  personaLabel?: string;
}): string {
  const fromExemplar = exemplarNameFromPcm(input.focalPcm);
  if (fromExemplar) return fromExemplar;
  const fromLabel = personaLabelFromPcm(input.focalPcm) ?? input.personaLabel?.trim();
  if (fromLabel && !isTechnicalStoryIdentityLabel(fromLabel)) {
    return fromLabel;
  }
  const base = resolveHumanProtagonistName(input);
  if (!isTechnicalStoryIdentityLabel(base)) {
    return base;
  }
  const pcmId = input.focalPcm?.id?.trim() || input.snapshot.who?.pcmId?.trim();
  if (pcmId) {
    return humanizeStoryWireLabel(pcmId) || base;
  }
  const storyId = input.snapshot.storyId?.trim();
  if (storyId) {
    return humanizeToken(storyId) || base;
  }
  return base;
}

export function formatProtagonistInstanceCredits(input: {
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
}): string | undefined {
  const storyId = input.snapshot.storyId?.trim();
  const personaId = input.snapshot.personaId?.trim() || input.character?.personaId?.trim();
  const pcmId = input.snapshot.who?.pcmId?.trim() || input.character?.psychology?.pcmId?.trim();
  const bits: string[] = [];
  if (storyId && isTechnicalStoryIdentityLabel(storyId)) {
    bits.push(`project instance \`${storyId}\``);
  }
  if (personaId && personaId !== storyId && isTechnicalStoryIdentityLabel(personaId)) {
    bits.push(`catalog id \`${personaId}\``);
  }
  if (pcmId) {
    bits.push(`org PCM \`${pcmId}\``);
  }
  if (bits.length === 0) return undefined;
  return bits.join(' · ');
}

export function buildProtagonistWhoBlurbLines(input: {
  name: string;
  snapshot: StoryBriefSnapshotV1;
  character?: StoryBriefCharacterV1;
  personaGoals?: readonly string[];
  personaFrustrations?: readonly string[];
  personaQuote?: string;
  storyPitch?: string;
}): string[] {
  const lines: string[] = [];
  const credits = formatProtagonistInstanceCredits({
    snapshot: input.snapshot,
    character: input.character,
  });
  if (credits) {
    lines.push(`${input.name} is the focal character for this episode (${credits}).`);
  } else {
    lines.push(`${input.name} is the focal character for this episode.`);
  }
  const pitch = input.storyPitch?.trim() || input.snapshot.storyPitch?.trim();
  const goals = (input.personaGoals ?? []).map((g) => g.trim()).filter(Boolean).slice(0, 2);
  const frustrations = (input.personaFrustrations ?? [])
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 1);
  if (pitch) {
    lines.push(pitch.endsWith('.') ? pitch : `${pitch}.`);
  } else if (goals.length > 0) {
    lines.push(`She wants ${goals.join('; ').toLowerCase()}.`);
  }
  if (input.personaQuote?.trim()) {
    lines.push(`“${input.personaQuote.trim()}”`);
  } else if (frustrations.length > 0) {
    lines.push(`What gets in her way: ${frustrations[0]}.`);
  }
  return lines.slice(0, 3);
}
