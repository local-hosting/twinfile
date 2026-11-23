/** Place golden catalog for the monorepo containing `fromDir`, when it exists. */
export declare function resolveExamplesRoot(fromDir?: string): string | undefined;
/** Nearest ancestor of `fromDir` that owns `twin.local.yaml` refs (overlay packs such as overlay-pack). */
export declare function resolveTwinfilePackRoot(fromDir: string): string | undefined;
/**
 * Ref resolution root for audit / compose / build / run:
 * overlay pack (`twin.local.yaml` or kind-folder layout), else monorepo place examples catalog.
 */
export declare function resolveAuditExamplesRoot(fromDir: string): string | undefined;
