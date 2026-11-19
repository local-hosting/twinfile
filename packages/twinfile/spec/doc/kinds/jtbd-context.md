# JTBD — context → goal → outcome (without obstacle)

Canonical progress statement:

> **When** [Context / Circumstance], **I want to** [Goal / Job], **so I can** [Outcome / Need] **without** [Pain Point / Obstacle].

| Clause | Wire field | Means |
| --- | --- | --- |
| Context / Circumstance | `context` | Situation that triggers progress (not desire language) |
| Goal / Job | `goal` | Progress sought |
| Outcome / Need | `outcome` | Definition of success |
| Pain Point / Obstacle | `obstacles[]` | Friction to avoid or remove |

Legacy keys (`when`/`want`/`so`, `situation`/`motivation`/`desiredOutcome`) normalize into `context` / `goal` / `outcome` at parse time.

**Context** is a twin kind (`kind: context`) for mountable JTBD packs (`JobContextModel`), separate from **character** (who) and **story** (which blesses a character with a context for an episode).

## Story bless

On a story twin head (`steps.story.bless`), assign context(s) to character(s):

```yaml
steps:
  - story:
      bless:
        - character: twinfile/character/wireless-greeter:0.1.0
          context: twinfile/context/wireless-retail:0.1.0
```

Wire type: `StoryBlessBinding` in `@local-hosting/twinfile/story/narrative`.

Related: [character-story.md](character-story.md), [kinds.md](kinds.md).
