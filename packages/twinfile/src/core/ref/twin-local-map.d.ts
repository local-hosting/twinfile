export type TwinLocalMap = Map<string, string>;
/** Load `twin.local.yaml` ref map from one catalog root (`examples/`, `simulator/`, …). */
export declare function loadTwinLocalMap(catalogRoot: string): TwinLocalMap;
/** Merge ref maps; later roots override duplicate keys. */
export declare function mergeTwinLocalMaps(...maps: TwinLocalMap[]): TwinLocalMap;
export declare function resolveTwinLocalPath(ref: string, map: TwinLocalMap): string | undefined;
