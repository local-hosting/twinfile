# World session (clock, timeline, player, runner)

Normative vocabulary: [Glossary — World time](../glossary.md#world-time-clock-timeline-player-runner). Time mechanics: [Time](time.md). Patch bus: [Patch](../pack/patch.md). Offline ENTRYPOINT: [Runners](../pack/runners.md). Host duties: [Host adapters](../pack/adapters/host.md).

Use this page when aligning **Twinfile**, **workbench**, and **host apps** (live simulators and canvas hosts) on one model.

## One timeline

| Piece | Where | Notes |
| --- | --- | --- |
| **`clock:`** | Scene **`run.yaml`** | `starts_at`, `duration`, `step` → playhead `t` |
| **tracks / schedules / feeds** | Place layers | Recipes evaluated at each `t` |
| **`timeline.at(t)`** | `@doppler-group/twinfile-simulator` (`openTimelineForPlace`) | Authoritative sample: tracks, `active`, `occupancy`, `phaseStarts`, … |
| **Patch wires** | Host only | `TwinMessageV1` on module **bus** — not YAML |

Do **not** publish catalog refs named `twinfile/clock` or `twinfile/player`. **Clock** is a field; **player** is host code.

## Four roles (do not merge names)

| Prose | Owns | Sink / output |
| --- | --- | --- |
| **Session** | built `Place` + `clock:` + current `t` | Read model for UI and algorithms |
| **Player** | Advancing `t`, play/scrub/speed | Patch **module bus** (`signal:trigger`, `twin:situation`, `signal:*`) |
| **Runner** | `use.runner` **ENTRYPOINT** | **Stdout** JSON Lines (`twin run`, frozen verify) |
| **Run** | Story scene **`run.yaml`** | Compose + optional `clock:` + optional `use.runner` |

**Consolidate implementation, not manifest pins:** built-in threshold replay can be one library invoked by **player** (live metrics on the bus) and by **`twin run`** (JSONL). Untrusted **`npm:`** runners stay subprocesses ([`gov/security.md`](../gov/security.md)).

```text
                    ┌─► Player ──► TwinMessage IN (live product)
  clock + built `Place` ──► timeline.at(t)
                    └─► Runner ──► JSONL (offline answer)
```

## Scenario shapes

| `clock:` | `use.runner` | Typical use |
| --- | --- | --- |
| yes | yes | `twin run`, workbench Time + verify, answer `question:` |
| yes | no | **Session-only** — scrub/play on bus, no frozen stdout contract |
| no | yes | Rare — runner without grid (legacy); prefer `clock:` when time matters |
| no | no | Static compose / args-only runs |

Cards show **`runner.stdout`** on the **offline** port when `use.runner` is set — not processor **Out** wires on places.

## Workbench session clock

When a scenario has **`clock:`**, the workbench shows a **session clock** (play / pause, step, scrub) and a **place-local time** readout. Transport calls **`POST /api/time/advance`** with `fromT` and `toT`, using the same **`createWorldSession`** path as hosts.

**Session clock bus (TypeScript):** `createSessionClockBus()` is an in-process bus (not the patch **module bus**). Each move along the scenario **`step`** grid emits **`note`** events (one per grid position, like notes on a scale), plus **`edge`** (phase / schedule / mode) and **`advance`**. Hosts attach **`createWorldSession({ bus })`**; UI subscribes with **`bus.on('note', …)`**. Patch **player** code should read **`edge`** events (or `sessionClockEdgesFromRecords`) — not a parallel `edges` field.

**`@doppler-group/twinfile-simulator/host`** owns bus → patch wiring (`createTwinfilePlayer`, `twinfilePlayerAdvance`, `attachSessionClockEventManager`). Scrub/play emit **`note`** / **`edge`** on the session clock bus; **`edge`** drives patch publish (phases + schedule/mode **signals**). Workbench replays bus events after advance so scrub triggers live pulse + world pulse UI.

On a host site, preview uses **`entry`** for the **place card** (spatial twin) and optional **`lens`** for the active **run** (a story scene `run.yaml`). Session clock, **`question`**, **`use.runner`**, **`clock`**, and args come from the lens build; they do not replace the place card. The place is built and (live) **played**; only the **run** is executed by the **runner** (offline) or driven by the host **player**. URL: `?entry=river&lens=scenarios/...`.

## Host player (checklist)

1. Build or load the built **`Place`** for the site + run stack (`TFPlace.load` / `buildTwinfile`).
2. Parse scenario **`clock:`**; call **`openTimelineForPlace`** once (or lazy per `t`).
3. Maintain playhead **`t`** (user scrub, play loop, optional speed multiplier).
4. Each tick or **edge**: `sample = timeline.at(t)`; diff against previous sample.
5. Publish **IN** messages processors already accept (same payloads as `placeType.controls` and situation pulses).
6. Do **not** require **`use.runner`** for playback.

**Playback runtime** (`createClock`, `openPlaceTimeline`, `createWorldSession`, `createWorldClockPlayback`, `createTFSessionBus`, scrub helpers) lives in **`@doppler-group/twinfile-simulator`**, not in **`@doppler-group/twinfile-core`**. **`TFPlace.load(Twinfile.at(unitDir))`** builds from the on-disk Twinfile and returns a **`TFPlace`**; hosts pass **`TFPlace`** / **`TFWorld`** to world code — not YAML. **`createTFPlaceRuntime`** is the per-place observer: **clock**, **weather programmes**, **module bus** → **`TFPlaceState`** (occupancy, phases, signals); preset manifest **`mode:`** does not drive that state. Cached compose in the workbench uses **`TFPlace.compose(buildResult)`** only. The built image stays in memory (`TFPlace`); **`<unit>.twin.lock`** is the on-disk pin (`@doppler-group/twinfile-core`). **`@doppler-group/twinfile-core`** keeps build/merge; **`@doppler-group/twinfile-simulator/host`** is session bus → patch bus. Do not publish a separate `@twinfile/clock` catalog ref.

## Runner (checklist)

1. Same **timeline** object sent on runner stdin when `clock:` is present ([runner input](time.md#runner-input)).
2. **`question:`** + **`args:`** drive the solver; stdout is run records.
3. MCP / CLI need explicit consent before spawning **`npm:`** processes.

## Cross-repo mapping (cleanup)

When porting concepts from legacy host personas or other simulators:

| Their idea | Twinfile term | Implementation |
| --- | --- | --- |
| `SimulationClock`, `advanceClock` | **Session** playhead + optional speed | Host player; grid from scenario **`clock:`** |
| `advanceSimulation` (day boundary) | **Player** edge + optional day rollover | Host policy; place **schedules** already in `timeline` |
| Daylight-style job dispatch | **Opportunity** selection | Not a Twinfile ref — host or `schedules` / event **`timetable:`** |
| Trends **EventTimeline** UI | Scrub / catalog chrome | Workbench **Time** tab; not physics |
| Synthetic JSONL stdout | **Runner** | `use.runner` only |

**Live host products** should use the **patch module bus** for buttons and play; **Twinfile `twin run`** stays CI/verify. Share **`timeline.at(t)`**, not duplicate schedule math in the host.

## Anti-patterns

| Avoid | Prefer |
| --- | --- |
| “Event bus” for patch messages | **Module bus** / **patch bus** (`TwinMessageV1`) |
| `kind: event` as runtime messaging | **Event** = timetable **stage pack** (`copy:`) |
| Scenario card **Out** = live `signal:status` | Place **`processors:`** / **place type** outs; scenario **runner.stdout** = offline only |
| Second time system in the host | **`openTimelineForPlace`** |
| `twinfile/player` OCI unit | **`@doppler-group/twinfile-simulator/host`** (session bus → patch); not a catalog ref |

## Related

- [Integration — open vs host](../pack/integration.md)
- [Live controls vs offline runs](https://github.com/twinfile/twinfile.org/blob/main/src/app/situations/page.mdx) (twinfile.org)
- RFC [0003 — Time](../../rfcs/0003-time.md)
