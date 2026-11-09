import { TWINFILE_SUMMARY_LAYOUT_ID, type TwinfileSummaryLayoutV1, type TwinfileSummaryV1, type TwinfileUseMode } from '@local-hosting/twinfile-core';

/** Resolve layouts for render (`place` summary layout). */
export function summaryLayoutsForHtml(card: TwinfileSummaryV1, _mode?: TwinfileUseMode): TwinfileSummaryLayoutV1[] {
  const layouts = card.layouts as Record<string, TwinfileSummaryLayoutV1 | undefined>;
  const primary = layouts.place ?? layouts[TWINFILE_SUMMARY_LAYOUT_ID];
  if (primary && Array.isArray(primary.blocks)) return [primary];
  return Object.values(layouts).filter(
    (l): l is TwinfileSummaryLayoutV1 => l != null && Array.isArray(l.blocks),
  );
}
