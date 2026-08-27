# Result Reconciliation

The orchestrator is the single writer for canonical results. Reconciliation is performed after all independent workers and again after the stateful lane.

## Required checks

- Every executable TestCase has exactly one owner in `testcase-assignment-registry.json` for an execution batch.
- A duplicate result for the same `TestCaseId` is a `RESULT_CONFLICT`; do not overwrite or choose a winner silently. Retries are separate attempts and retain earlier evidence.
- Evidence IDs are unique, point to existing run/worker/case paths, and resolve to a known `WorkerId` and `TestCaseId`.
- Counts are recomputed from the canonical result set. `PASS`, `FAIL`, and `ERROR` are executed; `CatalogTotal - PassCount` is not a not-executed count.
- `MANUAL` with a page interaction and screenshot has `ExecutionAttempted=true` and `ManualReviewRequired=true`. `SKIPPED` means intentional scheduling skip only.
- Cleanup/evidence errors are secondary diagnostics and do not replace the original case status.

Defect identity uses `Feature + Operation + EndpointOrPage + FailureCategory + NormalizedFailureSignature`. Merge duplicate fingerprints while retaining all TestCaseIds, WorkerIds, attempts, and evidence references. A defect is created only from an executed product contradiction; harness errors, environment blocks, manual boundaries, skipped cases, and design/runtime mismatches remain in their dedicated outputs.

Final report generation consumes the reconciled result, evidence, defect, coverage, assignment, and cleanup indexes. Workers may propose missing TestCases with a `StableCaseKey`, but only the orchestrator assigns a formal TestCaseId and updates the global catalog after reconciliation.
