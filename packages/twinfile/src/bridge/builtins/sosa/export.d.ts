import { type FeedRow } from '../../authoring.js';
type Row = Record<string, unknown>;
export declare function exportPlace(place: Row, feed?: FeedRow): Record<string, string>;
export {};
