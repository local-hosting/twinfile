# Site folder layout

Standard **catalog site** tree (bases and mixins omit optional paths).

```text
<unit>/
  <unit>.twin.yaml              # place | base | mixin | nested building (v2 + steps:)
  README.md                  # pin + story (sites); one link to docs/layout.md
  docs/layout.md             # fiction map + id tables (sites)
  expected/contract.json     # strict binding snapshot (sites with bind:)
  parts/<name>/          # optional — only when `copy:` is justified (see PARTS.md)
  ext/layout-index.yaml      # optional workbench layout drill-down
  sources/                   # optional fixtures (e.g. river gauges)
```

**Not catalog sites:** `base-*`, `mixin-*`, `fixtures/` (test scaffold), `conf/`, `mcp/`.

**Recipe order (campus):** `place` → `levels` → topology → decoration → `bind:` → `copy:` last.

Runs live under [`catalog/story/examples/<story>/scenes/<scene>/run.yaml`](../../story/examples/); CI runs **`twin verify`** on scenes with **`expected/digest.txt`**.
