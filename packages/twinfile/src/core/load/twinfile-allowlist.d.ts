export declare const ALLOWED_TWINFILE_ROOT_NAMES: Set<string>;
/** Allow named layout dirs or any child folder that is its own Twinfile unit. */
export declare function isAllowedTwinfileRootEntry(name: string, unitRoot?: string): boolean;
