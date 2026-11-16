# Situation role vocabulary

Situation **`expects`** keys and **`roles[]`** tags on spaces, openings, `markers`, gauges, and stations use a **global controlled vocabulary** shipped in [`conf/role-vocabulary.yaml`](../../conf/role-vocabulary.yaml). The **`markers`** collection is operational map anchors (crossing, launch, debris drop) — not Wi‑Fi access points on **`assets`**.

| Field | Role |
| --- | --- |
| `id` | Stable role key (plan `roles` map key and **`roles[]`** on spaces, openings, etc.) |
| `kind` | Which place collection must supply ids (`space`, `opening`, `marker`, …) |
| `domain` | Grouping only (safety, mobility, environment, hydrology, events) |

## Strict enforcement (`twin check --strict`)

When validating a **place** plan against a **situation** unit:

1. Every **`expects`** key on the situation must appear in the vocabulary with matching **`kind`**.
2. Plan **`roles`** keys must match **`expects`** exactly (no extra keys).
3. Every id listed under a role must exist in the collection for that **`kind`**.
4. Each mapped row must include that role id in its **`roles[]`** array.
5. Every **`roles[]`** value on contract collections in the **merged place** must be a vocabulary **`id`**.

Add new roles by extending the vocabulary file first, then referencing them from situations and `place/` layers.

**Natural hazards:** common hazard labels map to situation units in [Natural hazards](natural-hazards.md) (`conf/hazard-catalog.yaml`).

**Not in this vocabulary:** people/org rows in `place/roles.yaml` (meta layer), DTPR, or arbitrary plan-only labels.
