export type ImportRow = Record<string, unknown>;
export declare function notedCategory(ext: ImportRow, sourceCategory: string | undefined): ImportRow;
export declare function kindFromToken(token: string | undefined, fallback: string): {
    kind: string;
    sourceCategory?: string;
};
export declare function parseCsv(text: string, where: string): ImportRow[];
export declare function isStationStop(stop: ImportRow): boolean;
export declare function stepFreeKind(kind: string): boolean;
export declare function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number;
export declare function localType(value: string): string;
export declare function localKey(key: string): string;
export declare function normalizeKeys(row: ImportRow): ImportRow;
