export type Row = Record<string, unknown>;
/** One JSONL observation row (SOSA import). */
export type FeedRow = Row;
export type BridgeRole = 'import' | 'export' | 'geometry';
export type ImportResult = {
    files: Record<string, string>;
    place: Row;
    feed?: FeedRow;
};
export type TwinBridge = {
    id: string;
    crosswalkSource: string;
    roles: BridgeRole[];
    importPlace?: (input: unknown) => ImportResult | Promise<ImportResult>;
    exportPlace?: (bundlePlace: Row, feed?: FeedRow) => Record<string, string>;
};
