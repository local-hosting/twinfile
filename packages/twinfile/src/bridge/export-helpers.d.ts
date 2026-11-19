export type ExportRow = Record<string, unknown>;
export declare function asExportRecord(value: unknown, where: string): ExportRow;
export declare function extRecord(row: ExportRow): ExportRow;
