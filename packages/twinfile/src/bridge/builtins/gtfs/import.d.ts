import { type ImportResult } from '../../authoring.js';
export type GtfsInput = {
    stops: string;
    shapes: string;
    pathways?: string;
};
export declare function importPlace(input: unknown): ImportResult;
