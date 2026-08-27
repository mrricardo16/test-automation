# Worker Contract

Workers receive a read-only `WorkerInput` derived from one Execution Snapshot:

```json
{
  "RunId": "RUN-20260827-01",
  "WorkerId": "worker-001",
  "WorkerRole": "INDEPENDENT_TEST_WORKER",
  "AssignedTestCases": ["TC-WEB-EXAMPLE-001"],
  "RuntimeConfigReference": "ignored-local-config:runtime",
  "SecretConfigReference": "approved-secret-store:runtime",
  "Namespace": "AT_RUN-20260827-01_worker-001",
  "ArtifactRoot": "runs/RUN-20260827-01/workers/worker-001",
  "ResourceLocks": [{"Resource": "LOG_READ", "Mode": "READ"}],
  "SafetyRules": ["product source is read-only", "no global report writes"],
  "SessionProfile": "WEB_ISOLATED",
  "ExecutionSnapshot": {"CatalogRevision": "...", "AutomationMappingRevision": "..."}
}
```

The orchestrator supplies references, never plaintext credentials. The worker creates its own agent/execution session; each Web worker creates its own BrowserContext or Browser Session, cookie jar, Page, and storage-state copy. Do not mutate a shared storage state or persistent UI page.

Each worker writes only `runs/<RunId>/workers/<WorkerId>/`: plan, result, evidence index, fixture registry, cleanup record, defect proposals, coverage, and catalog proposals. It never writes the catalog, formal result, global evidence/defect index, canonical Markdown/HTML, final coverage, or summary.

Each worker output contains `WorkerId`, counts, `ResultPath`, `EvidenceIndexPath`, `FixtureRegistryPath`, `CleanupPath`, `DefectPath`, `CoveragePath`, and `FinalWorkerStatus`. Each case result contains `RunId`, `WorkerId`, `TestCaseId`, `ExecutionAttempted`, `FinalStatus`, `Expected`, `Actual`, `FailureCategory`, `BlockReason`, `ManualReviewRequired`, `StartTime`, `EndTime`, `EvidenceRefs`, `FixtureRefs`, and `CleanupResult`.

The worker lifecycle is `Start → Create Session → Login/Prepare → Execute Assigned Cases → Evidence → Worker Cleanup → Close BrowserContext → Final Result`. Cleanup may delete only the worker's own namespace. Report a residual or expected persistent fixture explicitly; never hide it by widening cleanup scope.
