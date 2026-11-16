# Built Place (build output)

**`twin build`** composes a **`Place`** in memory: merged collections on **`Place.data`**, plus **`meta`**, **`digest`**, and layer chain. Author with **`Twinfile.at(root).build()`**; wrap with **`TFPlace.load()`** for playback. **`<unit>.twin.lock`** pins digests on disk when lock write is enabled.

## Docker mapping

| Docker | Twinfile |
| --- | --- |
| **`docker build`** | **`twin build`** / compose in memory |
| **Image** | **`Place`** (`Place.toWire()` for MCP/OCI wire JSON) |
| **Container** | **`TFPlace`** |
| **`docker history`** | **`twin layers`** (rebuilds; layer list is not persisted on disk) |
| **Registry** | **`twin pack --out <dir>`** then **`twin push`** (OCI under `--out`, not inside the unit) |

Persisted pins: **`<unit>.twin.lock`** (manifest + tree + layer chain digests). Optional **`expected/digest.txt`** on run folders.

Wire schema: [`place-wire.schema.json`](../../schemas/1/run/place-wire.schema.json).

MCP (per unit ref `twinfile/<id>:<version>`):

- **`twin://twinfile/<id>:<version>/place`** — `Place.toWire()` (+ `refKey` in MCP bodies)
- **`twin://twinfile/<id>:<version>/place/{collection}/{id}`** — one row
- Session aliases **`twin://place`** and **`twin://place/{collection}/{id}`** for single-unit `twin serve`
