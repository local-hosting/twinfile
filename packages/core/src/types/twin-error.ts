export type TwinErrorCode =
  | 'E_SCHEMA'
  | 'E_UNKNOWN_FILE'
  | 'E_MISSING_FILE'
  | 'E_NO_MANIFEST'
  | 'E_NO_PLAN'
  | 'E_ROLE_MISSING'
  | 'E_ROLE_KIND'
  | 'E_ROLE_REF'
  | 'E_ROLE_MIN'
  | 'E_ROLE_VOCAB'
  | 'E_ROLE_TAG'
  | 'E_TIMETABLE_REF'
  | 'W_DTPR_MISSING'
  | 'W_DTPR_ACCOUNTABLE_REF'
  | 'E_GEOTYPE_UNKNOWN'
  | 'E_LAYOUT'
  | 'E_ARCHETYPE_AXES'
  | 'E_ARCHETYPE_AXES_MISMATCH'
  | 'E_LOCK_DRIFT'
  | 'E_BUILD'
  | 'E_PROCESSOR'
  | 'E_CATALOG'
  | 'E_EVENT'
  | 'E_MESSAGE';

export type TwinError = {
  code: TwinErrorCode;
  message: string;
  file?: string;
  line?: number;
  col?: number;
  hint?: string;
};

export type Result<T, E = TwinError[]> =
  | { ok: true; value: T }
  | { ok: false; errors: E };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err(errors: TwinError[]): Result<never> {
  return { ok: false, errors };
}
