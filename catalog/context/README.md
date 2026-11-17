# @doppler-group/twinfile-context

Twin type for **JTBD context** packs — separate from **character** (who) and **story** (episode).

## JTBD statement

> When [Context / Circumstance], I want to [Goal / Job], so I can [Outcome / Need] without [Pain Point / Obstacle].

| Clause | Wire |
| --- | --- |
| Context / Circumstance | `context` |
| Goal / Job | `goal` |
| Outcome / Need | `outcome` |
| Pain Point / Obstacle | `obstacles[]` |

Import the contract from **`@doppler-group/twinfile-context`** (or `/browser`).

A story **blesses** a character with a context for an episode; that context informs behavior.

Heads: `examples/`. JTBD YAML libs: `libs/jtbd/`.
