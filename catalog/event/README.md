# @doppler-group/twinfile-event

Twin type package — layout: [`packages/spec/doc/type-package-layout.md`](../../packages/spec/doc/type-package-layout.md).

An **event** names what happens at a place: ordered `phases`, the roles it `expects` from the place, and `args` with defaults. It carries no clock times — the scene (`schedule:`) or the simulator decides when each phase starts and how long it lasts.

Places host an event through their own roles: every feature whose `roles` include an expected role fills it, unless the place narrows that with `bindings/<event>.yaml`.

`examples/<id>/<id>.twin.yaml` — catalog events (hazards, operations, programmes).
