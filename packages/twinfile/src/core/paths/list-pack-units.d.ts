import { type TwinCatalogType } from './catalog-layout.js';
/** `story/`, `place/`, … under a pack root (e.g. osc-twinfile). */
export declare function packKindFromDir(dir: string): TwinCatalogType | undefined;
export declare function listPackUnitDirs(kindDir: string): string[];
export declare function listPackUnitDirsForPack(packRoot: string, typeFilter?: TwinCatalogType): string[];
/** Overlay pack layout (`place/`, `story/`, … each with twin heads) without `twin.local.yaml`. */
export declare function isTwinfileOverlayPackRoot(dir: string): boolean;
export declare function overlayPackUnitDir(packRoot: string, kind: TwinCatalogType, unitId: string): string;
