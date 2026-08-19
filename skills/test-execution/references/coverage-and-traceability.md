# Coverage and traceability

Preserve all Handoff IDs and maintain a trace from Handoff dimension to Coverage row, TestCase, execution result, evidence, and development feedback.

## Dimensions

Track Module, Feature, Business Rule, Business Flow, Validation, Boundary, Permission, State, API, Error Path, Data Consistency, UI Observable Result, Priority, Suggested Test Layer, TestCase, and Execution Status.

## Stable identifiers

Keep source IDs such as `MOD-*`, `FEAT-*`, `RULE-*`, `FLOW-*`, `API-*`, `VALID-*`, and `STATE-*`. Assign stable TestCase IDs in the form `TC-WEB-*`, `TC-API-*`, or `TC-MANUAL-*`. Reuse existing TestCases when their Expected and scope still match; update them explicitly, create a new version, or mark an obsolete candidate. Never silently delete one.

## Reconciliation states

Use only these coverage states: `COVERED_PASS`, `COVERED_FAIL`, `COVERED_ERROR`, `BLOCKED`, `MANUAL_PENDING`, `NOT_APPLICABLE`, and `NOT_COVERED`. A P0 `NOT_COVERED` row prevents a regression-complete claim. `COVERED_FAIL` is still covered and must retain product evidence.

## Minimum row

Each row includes Handoff ID, ModuleId, FeatureId, Priority, Suggested Test Layer, TestCaseId, current TestCase status, reconciliation state, evidence path, limitation/reason, and feedback action.
