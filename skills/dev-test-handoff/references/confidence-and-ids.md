# Confidence and Stable IDs

## Evidence vocabulary

Use exactly one value for each substantive fact:

| Value | Meaning | Permitted evidence |
|---|---|---|
| `CONFIRMED_FROM_CODE` | Directly shown by readable source. | Route literal, call, type, branch, validator, policy, or configuration structure. |
| `CONFIRMED_FROM_RUNTIME` | Shown by supplied real runtime/test evidence. | Timestamped report, screenshot, trace summary, or response evidence supplied by the user. |
| `INFERRED` | Reasonable relationship derived from multiple observations but not explicitly declared. | Cross-file relationship with stated reasoning and evidence. |
| `UNKNOWN` | Material is insufficient to determine the fact. | Missing source, runtime, documentation, or external-system evidence. |

Do not use `CONFIRMED_FROM_RUNTIME` merely because code looks executable. Do not convert `INFERRED` or `UNKNOWN` to `CONFIRMED` during Handoff projection.

## Stable identifier families

Assign deterministic, readable IDs within the project scope:

| Entity | Prefix | Example |
|---|---|---|
| Module | `MOD-` | `MOD-SYSTEM-USER` |
| Feature | `FEAT-` | `FEAT-SYSTEM-USER-CREATE` |
| Business rule | `RULE-` | `RULE-SYSTEM-USER-001` |
| Business flow | `FLOW-` | `FLOW-SYSTEM-USER-CREATE` |
| API | `API-` | `API-SYSTEM-USER-CREATE` |
| Validation | `VALID-` | `VALID-SYSTEM-USER-001` |
| State | `STATE-` | `STATE-ORDER-APPROVED` |

IDs must be unique, stable across regenerated documents, and reused unchanged in Handoff. Do not encode a line number that will change on harmless formatting edits. If an ID must change because the entity was genuinely split or merged, record the supersession in the As-Built index and traceability matrix.

## Fact record

Use this shape in Markdown tables or sections:

```text
ID: <stable ID or N/A>
Statement: <one externally meaningful fact>
Confidence: <one allowed value>
Evidence: <relative file/symbol, runtime report, or UNKNOWN reason>
```

For an ambiguous branch such as `status == 1`, record the branch participation as code-confirmed and the business meaning as `UNKNOWN` unless an enum, label, runtime evidence, or explicit rule proves it.
