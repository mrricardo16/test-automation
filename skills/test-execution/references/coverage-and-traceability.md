# Coverage and traceability

Preserve all Handoff IDs and maintain a trace from Handoff dimension to Coverage row, TestCase, execution result, evidence, and development feedback.

## Dimensions

Track Module, Feature, Business Rule, Business Flow, Validation, Boundary, Permission, State, API, Error Path, Data Consistency, UI Observable Result, Priority, Suggested Test Layer, TestCase, and Execution Status.

## Stable identifiers

Keep source IDs such as `MOD-*`, `FEAT-*`, `RULE-*`, `FLOW-*`, `API-*`, `VALID-*`, and `STATE-*`. Assign stable TestCase IDs in the form `TC-WEB-*`, `TC-API-*`, or `TC-MANUAL-*`. Reuse existing TestCases when their Expected and scope still match; update them explicitly, create a new version, or mark an obsolete candidate. Never silently delete one.

## Canonical execution and coverage

Keep `ExecutionStatus` and `CoverageStatus` separate. `ExecutionStatus` is one of `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, or `SKIPPED`; `CoverageStatus` is one of `COVERED`, `PARTIAL`, `UNTESTED`, `MANUAL`, or `NOT_APPLICABLE`. A P0 `UNTESTED`/`PARTIAL` row prevents a regression-complete claim. A `FAIL` remains a product failure and must retain product evidence.

Legacy values such as `COVERED_PASS`, `COVERED_FAIL`, `COVERED_ERROR`, `MANUAL_PENDING`, and `NOT_COVERED` are accepted only through `LegacyFieldAdapter` and are not active canonical vocabulary.

## Minimum row

Each row includes Handoff ID, ModuleId, FeatureId, Priority, Suggested Test Layer, TestCaseId, current `ExecutionStatus`, `ApplicabilityStatus`, `CoverageStatus`, `GateStatus`, evidence path, limitation/reason, and feedback action.
