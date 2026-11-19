import { type ImportResult } from '../../authoring.js';
export type IfcBytesInput = {
    ifcBytes: Uint8Array;
    file?: string;
    name?: string;
};
export declare function importIfcStep(input: IfcBytesInput): Promise<ImportResult>;
export declare function isIfcBytesInput(input: unknown): input is IfcBytesInput;
