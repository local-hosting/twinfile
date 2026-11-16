/** Parsed `Twinfile.lock` (see spec `twinfile/lock.schema.json`). */
export type TwinfileLockRefEntry = {
  version: string;
  manifest?: string;
  tree?: string;
  layers?: string[];
};

export type TwinfileLockDocument = {
  twinfile: 1;
  refs: Record<string, TwinfileLockRefEntry>;
  meta?: { overridden?: boolean };
};

export const TWINFILE_LOCK_FILENAME = 'Twinfile.lock';

export function lockRefKeyFromTwinfile(twinfile: Record<string, unknown>): string {
  const id = String(twinfile.id ?? 'unknown');
  const version = String(twinfile.version ?? '0.0.0');
  return `twinfile/${id}:${version}`;
}
