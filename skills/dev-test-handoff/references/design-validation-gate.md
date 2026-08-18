# Design Validation Gate

Write `16-design-coverage.md` after Stage A and before Stage B.

## Required checks

| Check | Pass condition | Failure marker |
|---|---|---|
| Source inventory | Every supplied project/app/service is listed or explicitly excluded. | `DESIGN_BASELINE_INCOMPLETE` |
| Module inventory | Every material module has `ModuleId`, purpose, entries, dependencies, confidence, and evidence. | Same |
| Route inventory | Every major reachable route/redirect has a `RouteId`, path, page, permission/menu state, and confidence. | Same |
| API inventory | Every externally testable endpoint has an `ApiId`, method, route, contract, auth, validation, errors, and confidence. | Same |
| Mapping | Every frontend API and backend API has `CONFIRMED`, `PROBABLE`, or `UNMATCHED`. | Same |
| Rules | Every material rule has `RuleId`, precondition, trigger, behavior, exception, confidence, and evidence. | Same |
| Unknowns | Every unresolved material fact is in `15-known-unknowns.md`. | Same |
| Inferences | Every `INFERRED` claim states the reasoning and evidence. | Same |

## Failure contract

When any required check fails, write:

```text
DESIGN_BASELINE_INCOMPLETE

Missing: <specific inventory or field>
Reason: <why source/evidence is insufficient>
Impact: <what downstream coverage or interpretation is limited>
```

Stage B can proceed only as a restricted projection that also contains:

```text
HANDOFF_LIMITED_BY_DESIGN_GAPS
```

Never fill a failed check with a guessed business rule. Use `UNKNOWN` or `NOT_APPLICABLE` with a reason.
