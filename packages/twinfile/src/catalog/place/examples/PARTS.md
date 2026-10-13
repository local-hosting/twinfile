# Campus parts (RFC 0009)

`twin init place` points authors here when geotypes **`suggest_building_import`** is true (resolved **`campus`** archetype). This file is **authoring prose only** — not merged at `twin build`.

**Patterns:** [Campus → building → floor](../../../../spec/doc/place/campus-building-floor.md).

A campus is a stack of building cards. Each building is its own Twinfile under `parts/<name>/`; floors nest under `parts/<name>/floors/<floor>/`. The parent copies each one in by path. Nested units are build stages: never published, no `twinfile/` ref.

Legacy twins may still use `buildings/` paths; loaders accept `copy: ./buildings/…` as a one-release alias for `./parts/…` ([`place-copy.ts`](../src/place/place-copy.ts)).

## Checklist

1. **Site anchor** — Add a space to the site's `spaces:` patch whose `id` is the building's `into:` anchor.
2. **Building stage** — `twin init place parts/<name> --geotype office_building` (or another indoor fiction). It uses `from: twinfile/base-indoor-stack:0.1.0`.
3. **Upgrade** — `twin fmt --upgrade=2 --recursive` on the site, so every manifest uses inline `steps:`.
4. **Copy** — Append to the site's `steps:`, after the patch that declares the anchor:

```yaml
  - copy: ./parts/<name>
    into: <anchor-space-id>
    # prefix: <anchor>-   # optional; default is "<into>-"
```

   For a floor, append to the **building's** `steps:` (no `into:`; the site's `into:` parents every row):

```yaml
  - copy: ./floors/<floor>
    prefix: <floor>-
```

5. **Mobility** — **Passages** (`openings:`) at thresholds; **paths** (`routes:`) for walks with distance. One edge per pair (see [topology taxonomy](../../../../spec/doc/place/topology-taxonomy.md)). `copy:` / `parent` is rollup only; site `openings:` / `routes:` patch links across nested buildings (manual today).
6. **Plans** — Bind event **roles** to merged ids (`twin add plan …`); weather often uses zone ids, surge may use prefixed rooms.
7. **Verify** — `twin build` on the **site**; a missing anchor fails with `no space "<id>" to copy into`.

## Golden references

| Pattern | Site | Nested |
| --- | --- | --- |
| A — one building | [`mobility-hub/campus`](mobility-hub/campus/) | [`parts/transit-hub`](mobility-hub/campus/parts/transit-hub/) |
| B — building + floor | [`airport`](airport/) | [`parts/terminal-a`](airport/parts/terminal-a/), [`floors/airside`](airport/parts/terminal-a/floors/airside/) |
| C — single building (`copy:`) | [`arena`](arena/) | [`arena/parts/concourse`](arena/parts/concourse/) |

**Inlined interior** (same graph, one site `<unit>.twin.yaml`): [`expo`](expo/) (`pavilion-opportunity-gallery`), [`port`](port/) (`warehouse-main`). Use nested `copy:` only when the building is large or reused.

Replace `<name>`, `<floor>`, and `<anchor-space-id>` with your site names.