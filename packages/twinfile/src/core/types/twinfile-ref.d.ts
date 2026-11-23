/** Published unit ref (`twinfile/name:tag` or pinned `oci:…`). */
export type TwinfileRef = string;
export declare const TWINFILE_REF_PATTERN: RegExp;
export type TwinfileRefKind = 'place' | 'scenario' | 'event' | 'base';
export declare function parseTwinfileRef(ref: string): {
    kind?: TwinfileRefKind;
    name: string;
    tag: string;
} | undefined;
export declare function isTwinfileRef(value: string): value is TwinfileRef;
/** `{kind}/{name}` identity for place-mount matching; kindless refs count as `place`, tag and digest are ignored. */
export declare function placeRefIdentity(ref: string): string | undefined;
export declare function samePlaceRef(a: string, b: string): boolean;
/** Typed place ref for mounts without a published unit (Character places, geo anchors). */
export declare function placeRefForName(name: string, tag?: string): TwinfileRef;
/** Flat `twinfile/<name>:<tag>` for catalogs that key refs without the kind segment (RFC 0008). */
export declare function flatTwinfileRef(ref: string): string;
