# Development feedback contract

The feedback pack must be understandable without the full test repository. Include Handoff Version, Environment, RunId, TestCase Baseline, scope, totals by final status, reconciliation totals, and P0/P1 coverage.

For each tested item include Handoff ID, TestCaseId, Expected, Actual, status, evidence path, defect or mismatch classification, limitation, and next action. Separate product FAIL from script ERROR, environment BLOCKED, MANUAL, NOT_APPLICABLE, and SKIPPED.

Include a concise list of:

- passed behavior verified by evidence;
- failed behavior with reproducible steps and evidence;
- blocked or not-covered behavior with exact reason;
- manual boundaries and weak-locator risks;
- `DESIGN_RUNTIME_MISMATCH` items without changing Expected;
- cleanup or evidence errors and safe follow-up.

Do not present a regression-complete claim when any P0 row is `NOT_COVERED`.
