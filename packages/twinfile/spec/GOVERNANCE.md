Normative or schema changes require an RFC in `rfcs/` merged after **7 days** with no unresolved objection. Editorial fixes do not.

## RFC format

Copy `rfcs/0000-template.md`. Every RFC MUST include:

- `Status:` — `Proposed`, `Accepted`, or `Accepted (bootstrap 1.0.0-draft.1)` for the initial draft only
- `Created: YYYY-MM-DD`
- Sections: Summary, Motivation, Specification, Conformance (substantive text in each)

CI runs `yarn check:gov` to enforce RFC shape. On pull requests, normative path changes MUST include an RFC update; `Proposed` RFCs cannot merge normative changes until `Created` is at least 7 days ago unless `Status` is `Accepted` or bootstrap.

## Bootstrap

The first publish **`1.0.0-draft.1`** was recorded under RFC 0001 and RFC 0002 with `Accepted (bootstrap 1.0.0-draft.1)`. All later normative changes follow the 7-day Proposed → Accepted path.
