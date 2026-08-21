# Development feedback contract

The feedback pack must be understandable without the full test repository. Include Handoff Version, Environment, RunId, TestCase Baseline, scope, totals by final status, reconciliation totals, and P0/P1 coverage.

For each tested item include Handoff ID, TestCaseId, Expected, Actual, status, evidence path, defect or mismatch classification, limitation, and next action. Separate product FAIL from script ERROR, environment BLOCKED, MANUAL, NOT_APPLICABLE, and SKIPPED.

`defect-list.md` is an index, not the detailed feedback itself. Assign a stable `DefectId` only to an executed product FAIL, retain the linked TestCaseId and Handoff IDs, and link each index row to exactly one `defect-feedback/<DefectId>.md` record. Each detailed record must include the classification, severity/impact, Preconditions, reproducible steps, Expected, Actual, evidence paths, environment/RunId, safe data and cleanup state, suspected scope only when supported by evidence, recommended next action, and regression scope. Do not create a defect feedback record for script `ERROR`, environment `BLOCKED`, `MANUAL`, `SKIPPED`, or `DESIGN_RUNTIME_MISMATCH`; report those in their dedicated outputs instead.

Include a concise list of:

- passed behavior verified by evidence;
- failed behavior with reproducible steps and evidence;
- blocked or not-covered behavior with exact reason;
- manual boundaries and weak-locator risks;
- `DESIGN_RUNTIME_MISMATCH` items without changing Expected;
- cleanup or evidence errors and safe follow-up.

Do not present a regression-complete claim when any P0 row is `NOT_COVERED`.
