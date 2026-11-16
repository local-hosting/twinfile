# Site folder layout

Standard **catalog site** tree (bases omit optional paths).

```text
<unit>/
  <unit>.twin.yaml              # place | base | nested building (v2 + steps:)
  README.md                  # pin + story (sites); one link to docs/layout.md
  docs/layout.md             # fiction map + id tables (sites)
  expected/contract.json     # strict binding snapshot (sites with bind:)
  parts/<name>/          # optional — only when `copy:` is justified (see PARTS.md)
  ext/layout-index.yaml      # optional workbench layout drill-down
  sources/                   # optional fixtures (e.g. river gauges)
```

**Not catalog sites:** `base-*`, `fixtures/` (test scaffold), `conf/`, `mcp/`.

**Recipe order (campus):** `place` → `levels` → topology → decoration → `bind:` → `copy:` last.

Runs are inline `run:` blocks on story scenes in [`catalog/story/examples/`](../../story/examples/); `yarn workspace @doppler-group/twinfile-core verify:scenarios` runs **`twin verify`** on scenes with **`run.expected.digest`**.
