export type ExportRow = Record<string, unknown>;

export function asExportRecord(value: unknown, where: string): ExportRow {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${where}: expected an object`);
  }
  return value as ExportRow;
}

export function extRecord(row: ExportRow): ExportRow {
  const ext = row.ext;
  if (!ext || typeof ext !== 'object' || Array.isArray(ext)) return {};
  return ext as ExportRow;
}
