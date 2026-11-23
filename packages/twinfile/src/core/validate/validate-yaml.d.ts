import { Document } from 'yaml';
import type { Result } from '../types/twin-error.js';
import { type TwinValidator } from './create-validator.js';
export type ParsedYamlFile = {
    path: string;
    doc: Document;
    value: unknown;
};
export declare function readYamlDocument(path: string): ParsedYamlFile;
/** Wrap an inline value (e.g. one `steps:` item) so file validators can report against it. */
export declare function inlineYamlDocument(path: string, value: unknown): ParsedYamlFile;
export declare function validateTwinfileFile(validator: TwinValidator, parsed: ParsedYamlFile): Result<Record<string, unknown>>;
export declare const PLACE_TYPE_SCHEMA_ID = "https://twinfile.org/schemas/1/place/place-type.schema.json";
export declare function validatePlaceTypeValue(validator: TwinValidator, value: unknown, fileHint?: string): Result<Record<string, unknown>>;
export declare function validatePlanFile(validator: TwinValidator, parsed: ParsedYamlFile): Result<Record<string, unknown>>;
export declare function validatePlaceLayerFile(validator: TwinValidator, parsed: ParsedYamlFile): Result<unknown>;
export declare function getDefaultValidator(): TwinValidator;
export declare function validateDocumentAtPath(path: string, schemaId: string): Result<unknown>;
