# Tellico River

**Creek / linear** example for releases, gauges, and lab feeds. Real pin; illustrative hydrology.

## Layout

- [`docs/layout.md`](docs/layout.md)
- [`ext/layout-index.yaml`](ext/layout-index.yaml)

## Runs

**Daily:** [`river-operations`](../../../story/examples/river-operations/river-operations.twin.yaml) — reach and eddy visit (`mode: daily`).

**Resilience:** [`river-resilience`](../../../story/examples/river-resilience/river-resilience.twin.yaml) — dam-release swim/stage watches, flood crest, and drought restriction (`mode: resilience`).

Presets wire **clock**, **args**, and **runners** only — no `question:` on the run manifest.
