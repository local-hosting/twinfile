import type { TouchpointChannel, TouchpointType } from './touchpoints.schema.js';

const GAME_TOUCHPOINT_IDS = new Set([
  'ar-store-overlays',
  'entertainment-zone',
  'dotcom-xumo',
]);

export interface TouchpointTypeInput {
  id: string;
  type?: TouchpointType;
  channel?: TouchpointChannel;
  /** @deprecated Use `channel` — legacy journey catalog field. */
  context?: TouchpointChannel;
  description?: string;
}

/** Resolve the formal touchpoint type from catalog metadata. */
export function classifyTouchpointType(record: TouchpointTypeInput): TouchpointType {
  if (record.type) return record.type;
  if (GAME_TOUCHPOINT_IDS.has(record.id)) return 'game';
  if (/augmented reality|\bar overlay/i.test(record.description ?? '')) return 'game';
  if (/\b(headset|vr goggles|mixed reality)\b/i.test(record.description ?? record.id)) {
    return 'headset';
  }
  if (/\b(wearable|smartwatch|smart watch|fitness band)\b/i.test(record.description ?? record.id)) {
    return 'wearable';
  }

  const channel = record.channel ?? record.context;
  switch (channel) {
    case 'social':
      return 'social';
    case 'store':
      return 'venue';
    case 'media':
      return 'streaming';
    case 'website':
      return 'web';
    default:
      return 'mobile';
  }
}

export const TOUCHPOINT_TYPES: TouchpointType[] = [
  'social',
  'venue',
  'mobile',
  'web',
  'game',
  'streaming',
  'headset',
  'wearable',
];
