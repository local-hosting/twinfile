export declare function sha256BufferHex(buf: Uint8Array): string;
export declare function sha256Digest(value: unknown): string;
/** First four bytes of sha256(key) as a unit interval — schedule / simulator variance. */
export declare function uniformUnitFromSha256Utf8(key: string): number;
export type LayerChainInput = {
    parent: string | null;
    content: string;
    kind: string;
    ref: string;
};
export declare function layerChainDigest(input: LayerChainInput): string;
export type PlaceImageDigestInput = {
    meta: Record<string, unknown>;
    place: Record<string, unknown>;
    layers: string[];
};
export declare function placeImageDigest(input: PlaceImageDigestInput): string;
export type BundleDigestInput = PlaceImageDigestInput;
