import type { AXMKind } from './kind.js';

export type InitAXMOptions = {
  title?: string;
  id?: string;
  kind?: AXMKind;
  force?: boolean;
  /** Copy the shipped ride-share `example/` instead of scaffolding a blank AXM. */
  example?: boolean;
};

export type InitAXMFailureReason = 'not_empty' | 'example_missing';

export type InitAXMResult =
  | { ok: true; created: boolean; root: string }
  | { ok: false; reason: InitAXMFailureReason };

export type InitTargetState = 'initialized' | 'not_empty' | 'ready';
