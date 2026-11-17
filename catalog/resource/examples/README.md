# Resource examples

Equipment, material, and product twins use **`<unit>.twin.yaml`**. Each unit is `resource/examples/<id>/` and publishes as `twinfile/resource/<id>:<ver>`.

**Sensor bases:** `base-sensor` (global DTPR + sample skeleton) → `wireless-sensor` (`from:` + wireless link) → site sensors (`cold-temp-sensor`, `cold-humidity-sensor`).

| Id | Place |
| --- | --- |
| `base-sensor` | — (resource base) |
| `wireless-sensor` | — (extends `base-sensor`) |
| `greeter-kiosk` | shop |
| `terminal-kiosk` | airport |
| `concession-cart` | arena |
| `trail-station` | park |
| `gallery-kiosk` | museum |
| `exhibit-kiosk` | aquarium |
| `classroom-kiosk` | school |
| `gangway-kiosk` | port |
| `pavilion-kiosk` | expo |
| `river-gauge` | river |
| `hub-kiosk` | transit-hub-campus |
| `station-kiosk` | mobility-hub |
| `dock-crane` | dunkirk-dock |
| `visitor-shuttle` | buffalo-harbor |
| `reefer-truck` | cold-chain |
| `cold-parcel` | cold-chain (on `cold-pallet`) |
| `cold-pallet` | cold-chain |
| `cold-temp-sensor` | cold-chain (extends `wireless-sensor`) |
| `cold-humidity-sensor` | cold-chain (extends `wireless-sensor`) |
| `falls-tram` | niagara-falls |
| `water-quality-sensor` | tennessee-river (Mountain Creek) |
| `river-buoy` | tennessee-river (Williams Island) |
| `bend-buoy` | tennessee-river (Moccasin Bend) |
