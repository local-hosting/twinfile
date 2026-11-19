import type { ImportResult } from './types.js';
export type PlaceRow = Record<string, unknown>;
/** Unit head suffix; `writeImportedFiles` renames the head to `<dir>.twin.yaml`. */
export declare const TWIN_HEAD_SUFFIX = ".twin.yaml";
export declare function twinId(raw: string): string;
export declare function asImportRecord(value: unknown, where: string): PlaceRow;
export declare function readImportName(value: unknown, fallback: string): string;
export declare function withImportExt(row: PlaceRow, ext: PlaceRow): PlaceRow;
/** Scaffold a place twinfile directory from merged place layer documents. */
export declare function packPlaceUnit(name: string, geotype: string, docs: PlaceRow[]): ImportResult;
