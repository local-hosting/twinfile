import type { ErrorObject, ValidateFunction } from 'ajv';
import type { Document } from 'yaml';
import type { TwinError } from '../types/twin-error.js';
export type TwinValidator = {
    validateTwinfile: ValidateFunction;
    validateLock: ValidateFunction;
    getSchema: (schemaId: string) => ValidateFunction | undefined;
};
export declare function createTwinValidator(): TwinValidator;
export declare const PLACE_LAYER_ROOT_KEYS: Record<string, string>;
export declare function schemaIdForPlaceLayerDocument(data: unknown): string | undefined;
export declare function ajvErrorsToTwinErrors(file: string, doc: Document | undefined, errors: ErrorObject[] | null | undefined): TwinError[];
