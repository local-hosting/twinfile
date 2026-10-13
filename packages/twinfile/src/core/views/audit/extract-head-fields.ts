import { isRecord } from '../../doc/is-record.js';
import { twinfileStepItems } from '../../load/twinfile-compose.js';

export type TwinfileAuditLink = {
  rel: string;
  href: string;
  anchor?: string;
};

export type TwinfileAuditStoryFields = {
  pitch?: string;
  scenes: { id: string; label?: string }[];
};

export type TwinfileAuditBlessRow = {
  character: string;
  context?: string;
};

export type TwinfileAuditCharacterFields = {
  role?: string;
  title?: string;
  goals: string[];
  frustrations: string[];
};

export function parseTwinfileLinks(doc: Record<string, unknown>): TwinfileAuditLink[] {
  if (!Array.isArray(doc.links)) return [];
  return doc.links.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const rel = typeof raw.rel === 'string' ? raw.rel.trim() : 'involves';
  const href = typeof raw.href === 'string' ? raw.href.trim() : '';
    if (!href) return [];
    const anchor = typeof raw.anchor === 'string' ? raw.anchor.trim() : undefined;
    return [{ rel, href, anchor }];
  });
}

export function extractStoryBless(doc: Record<string, unknown>): TwinfileAuditBlessRow[] {
  const rows: TwinfileAuditBlessRow[] = [];

  const applyBless = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const row of list) {
      if (!isRecord(row) || typeof row.character !== 'string') continue;
      const character = row.character.trim();
      if (!character) continue;
      const context = typeof row.context === 'string' ? row.context.trim() : undefined;
      rows.push({ character, context });
    }
  };

  if (isRecord(doc.story)) applyBless(doc.story.bless);
  for (const item of twinfileStepItems(doc)) {
    if (!isRecord(item) || !isRecord(item.story)) continue;
    applyBless(item.story.bless);
  }

  return rows;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function extractStoryFields(doc: Record<string, unknown>): TwinfileAuditStoryFields {
  const scenes: { id: string; label?: string }[] = [];
  let pitch: string | undefined;

  const top = doc.story;
  if (isRecord(top)) {
    if (typeof top.pitch === 'string' && top.pitch.trim()) pitch = top.pitch.trim();
    if (Array.isArray(top.scenes)) {
      for (const scene of top.scenes) {
        if (!isRecord(scene) || typeof scene.id !== 'string') continue;
        scenes.push({
          id: scene.id,
          label: typeof scene.label === 'string' ? scene.label : undefined,
        });
      }
    }
  }

  for (const item of twinfileStepItems(doc)) {
    if (!isRecord(item)) continue;
    const block = item.story;
    if (!isRecord(block)) continue;
    if (!pitch && typeof block.pitch === 'string' && block.pitch.trim()) {
      pitch = block.pitch.trim();
    }
    if (!Array.isArray(block.scenes)) continue;
    for (const scene of block.scenes) {
      if (!isRecord(scene) || typeof scene.id !== 'string') continue;
      if (scenes.some((row) => row.id === scene.id)) continue;
      scenes.push({
        id: scene.id,
        label: typeof scene.label === 'string' ? scene.label : undefined,
      });
    }
  }

  return { pitch, scenes };
}

export function extractCharacterFields(doc: Record<string, unknown>): TwinfileAuditCharacterFields {
  const goals: string[] = [];
  const frustrations: string[] = [];
  let role: string | undefined;
  let title: string | undefined;

  const applyBlock = (block: Record<string, unknown>) => {
    if (!role && typeof block.role === 'string') role = block.role;
    if (!title && typeof block.title === 'string') title = block.title;
    if (goals.length === 0) goals.push(...stringList(block.goals));
    if (frustrations.length === 0) frustrations.push(...stringList(block.frustrations));
  };

  if (isRecord(doc.character)) applyBlock(doc.character);
  for (const item of twinfileStepItems(doc)) {
    if (!isRecord(item) || !isRecord(item.character)) continue;
    applyBlock(item.character);
  }

  return { role, title, goals, frustrations };
}

export function extractContextFields(doc: Record<string, unknown>): {
  label?: string;
  context?: string;
} {
  let label: string | undefined;
  let context: string | undefined;

  const applyBlock = (block: Record<string, unknown>) => {
    if (!label && typeof block.label === 'string') label = block.label.trim();
    if (!context && typeof block.context === 'string') context = block.context.trim();
  };

  if (isRecord(doc.context)) applyBlock(doc.context);
  for (const item of twinfileStepItems(doc)) {
    if (!isRecord(item) || !isRecord(item.context)) continue;
    applyBlock(item.context);
  }

  return { label, context };
}

export function extractEventPitch(doc: Record<string, unknown>): string | undefined {
  if (isRecord(doc.event) && typeof doc.event.pitch === 'string' && doc.event.pitch.trim()) {
    return doc.event.pitch.trim();
  }
  for (const item of twinfileStepItems(doc)) {
    if (!isRecord(item) || !isRecord(item.event)) continue;
    if (typeof item.event.pitch === 'string' && item.event.pitch.trim()) {
      return item.event.pitch.trim();
    }
  }
  return undefined;
}

export function extractResourceKind(doc: Record<string, unknown>): string | undefined {
  if (isRecord(doc.resource) && typeof doc.resource.kind === 'string') {
    return doc.resource.kind;
  }
  for (const item of twinfileStepItems(doc)) {
    if (!isRecord(item) || !isRecord(item.resource)) continue;
    if (typeof item.resource.kind === 'string') return item.resource.kind;
  }
  return undefined;
}

const PLACE_ID_LIST_KEYS = ['assets', 'stations', 'spaces', 'sensors', 'visits'] as const;

function collectIdsFromLists(rows: unknown, ids: Set<string>): void {
  if (!Array.isArray(rows)) return;
  for (const row of rows) {
    if (isRecord(row) && typeof row.id === 'string') ids.add(row.id);
  }
}

export function collectPlaceAnchorIds(doc: Record<string, unknown>): Set<string> {
  const ids = new Set<string>();
  for (const key of PLACE_ID_LIST_KEYS) {
    collectIdsFromLists(doc[key], ids);
  }
  for (const item of twinfileStepItems(doc)) {
    if (!isRecord(item)) continue;
    for (const key of PLACE_ID_LIST_KEYS) {
      collectIdsFromLists(item[key], ids);
    }
  }
  return ids;
}

function collectPlaceStageRows(rows: unknown, out: { id: string; label: string }[], seen: Set<string>): void {
  if (!Array.isArray(rows)) return;
  for (const row of rows) {
    if (!isRecord(row) || typeof row.id !== 'string') continue;
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const name = typeof row.name === 'string' ? row.name : row.id;
    out.push({ id: row.id, label: name });
  }
}

export function listPlaceStageRows(doc: Record<string, unknown>): { id: string; label: string }[] {
  const rows: { id: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const key of ['spaces', 'stations'] as const) {
    collectPlaceStageRows(doc[key], rows, seen);
  }
  for (const item of twinfileStepItems(doc)) {
    if (!isRecord(item)) continue;
    for (const key of ['spaces', 'stations'] as const) {
      collectPlaceStageRows(item[key], rows, seen);
    }
  }
  return rows;
}