# Tellico River

**Creek / linear** example for releases, gauges, and lab feeds. Real pin; illustrative hydrology.

## Layout

- [`docs/layout.md`](docs/layout.md)
- [`ext/layout-index.yaml`](ext/layout-index.yaml)

## Runs

| Run | Intent doc |
| --- | --- |
| [`until-stage-unsafe`](../../../story/examples/river-resilience/river-resilience.twin.yaml) | `river-resilience#until-stage-unsafe` (`mode: resilience`) |
| [`swim-unsafe-known`](../../../story/examples/river-resilience/river-resilience.twin.yaml) | `river-resilience#swim-unsafe-known` (`mode: resilience`) |

Presets wire **clock**, **args**, and **runners** only — no `question:` on the run manifest.
