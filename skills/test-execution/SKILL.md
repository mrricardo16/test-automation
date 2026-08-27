---
name: test-execution
description: "Use when executing black-box Web, API, or Manual tests from a validated DEV-TEST-HANDOFF pack, especially when cases may run in parallel or share fixtures, sessions, runtime state, or cleanup."
---

# TEST-EXECUTION

Execute tests from an approved `test-handoff/` pack. The pack is the Expected Design Baseline; product source is not a default input and must not be read to invent coverage or expected results.

## Inputs and boundaries

Require these inputs before planning execution:

- `handoff_root`: read-only `DEV-TEST-HANDOFF` pack. Start with `00-TEST-WORKFLOW.md`, then read every related document and record Handoff Version, Environment, RunId, Generation Time, and TestCase Baseline.
- `runtime`: supplied Web URL, API base URL, desktop package, or Manual target plus environment notes.
- `output_root`: repository-owned output root for TestCases, reports, logs, screenshots, traces, and sanitized evidence.

Optional inputs are credentials, existing TestCases, existing reports, existing automation, scope, priority filter, test-layer filter, browser, and environment notes. Credentials may come only from environment variables, ignored local configuration, or an approved secret store. Never print, commit, or put credentials in evidence.

Do not modify the Handoff Expected baseline, product code, product test hooks, or product data to make a test pass. Do not fix product bugs, silently delete old TestCases, generate Word documents, or use source code to guess an Expected Result. A runtime mismatch is reported as `DESIGN_RUNTIME_MISMATCH`; it is not converted into PASS.

## Canonical Contracts and compatibility

Use the repository Canonical Contracts as the source of truth: [TestCase generation V2](../../contracts/testcase-generation-standard.md), [Composite TestCase](../../contracts/composite-testcase-standard.md), [TestCase](../../contracts/testcase-contract.md), [status](../../contracts/status-contract.md), [coverage](../../contracts/coverage-contract.md), [evidence](../../contracts/evidence-contract.md), [confidence](../../contracts/confidence-contract.md), and [stable IDs](../../contracts/id-contract.md). Apply the shared V2 generation and unattended routing rules by reference; do not restate a divergent local version. `LegacyFieldAdapter` maps old field names and reconciliation values into the canonical model without rewriting historical TestCases or reports.

Before Handoff intake, verify [handoff integrity](../../contracts/handoff-integrity-contract.md) with the shared Consumer helper in `scripts/platform/handoff-integrity.mjs`. Missing `ContractVersion` is legacy `BLOCKED`, a supported-version mismatch is `FAIL`, and neither outcome may be converted into a business-test result.

Keep `ExecutionStatus`, `ApplicabilityStatus`, and `CoverageStatus` separate. Runtime observation is Actual/Evidence, never `ExpectedBasis`; `CODE_BEHAVIOR` is only for characterization or implementation-regression claims.

Use `GateStatus`, `BaselineStatus`, `SourceRuntimeAlignment`, and `Confidence` as separate fields when those dimensions apply.

## Required workflow

1. **Handoff Intake:** Read `00-TEST-WORKFLOW.md` first, then all related Handoff documents. Missing scope, Expected Result, prerequisite, or stable Handoff ID means `HANDOFF_INCOMPLETE`; block only the affected case or run and never guess.
2. **Coverage Analysis:** Preserve every Handoff ID and map Module, Feature, Business Rule, Business Flow, Validation, Boundary, Permission, State, API, Error Path, Data Consistency, UI Observable Result, Priority, Suggested Test Layer, TestCase, and Execution Status.
3. **TestCase Design:** Create or reuse a stable TestCase before automation. Use `TC-WEB-*`, `TC-API-*`, or `TC-MANUAL-*`; new cases declare `CaseKind`, `ScenarioSuiteId`, `Objective`, `PrimaryAssertion`, coverage tags, risk, side effects, reversibility, and `AutomationEligibility`. Composite fields and ScenarioSuite aggregation come from the shared V2 contracts. Never write a formal test without its TestCaseId.
4. **TestCase Review Gate:** Before execution, verify P0/P1 coverage, explicit Expected Result, preconditions, safe test data, cleanup, destructive-operation safety, automation layer, and evidence requirements. Missing gates are blockers, not assumptions.
5. **Execution Planning:** Choose `WEB_UI`, `API`, `BOTH`, or `MANUAL`. Prefer the smallest scope requested: full regression, module regression, P0, failed rerun, or a single TestCase. Run a Runtime Health Check before formal execution.
6. **Automation or Manual Execution:** Prefer existing harnesses. For Web UI use Playwright and real user-visible interactions; for API use the Handoff API contracts; retain unsupported cases as `MANUAL`. Do not bypass the UI with hidden state, injected tokens, direct business-state JavaScript, or coordinate clicks.
7. **Evidence Collection:** Reuse the repository Web Evidence Helper. Capture failure screenshot, URL, failed step, Expected, Actual, and error stack; retain trace on failure when available. Sanitize passwords, auth headers, cookies, tokens, secrets, API keys, and sensitive network payloads.
8. **Coverage Reconciliation:** Record canonical `CoverageStatus` (`COVERED`, `PARTIAL`, `UNTESTED`, `MANUAL`, or `NOT_APPLICABLE`) separately from `ExecutionStatus`. A FAIL is covered and remains a product failure. Any P0 `UNTESTED`/`PARTIAL` row prevents announcing regression complete. Interpret legacy values through `LegacyFieldAdapter` only.
9. **Regression Reporting:** Produce the reports and evidence index listed below. Keep original TestCase status when cleanup or evidence capture fails; add the secondary `ERROR_*` reason.
10. **Development Feedback Pack:** Make tested, passed, failed, blocked, manual, not covered, mismatch, evidence, and next action understandable without opening the full test repository. Use `defect-list.md` only as the defect index, then create one `defect-feedback/<DefectId>.md` record for every product defect. Each detail record carries `DefectId`, `ExecutionStatus`, `CoverageStatus`, `GateStatus`, `Reproduction`, Expected, Actual, Evidence, Next action, and Regression scope.

## Multi-agent orchestration

When the selected scope has multiple executable cases, operate as `TEST_ORCHESTRATOR` with independent `INDEPENDENT_TEST_WORKER` and `STATEFUL_TEST_WORKER` roles. The external runtime owns agent capacity; this Skill consumes an explicit `available_worker_capacity` and never defines, changes, or assumes a global subagent/concurrency limit.

Use the two-phase boundary: first materialize and freeze one Execution Snapshot (`CatalogRevision`, `AutomationMappingRevision`, `AuthorityRevision`, and `RuntimeConfigRevision`), then execute it. Before dispatch, enrich every TestCase with `Dependencies`, `ProducesFixtures`, `ConsumesFixtures`, `ResourceLocks`, `ParallelSafety`, `AutomationEligibility`, `EnvironmentDependencies`, `WorkerAssignment`, `SessionProfile`, `TestDataNamespace`, `CleanupOwner`, and `EvidenceOwner`. Build `test-dependency-graph.json` with fixture, state, resource, ordering, and cleanup edges.

Use `INDEPENDENT_PARALLEL`, `STATEFUL_SERIAL`, `MANUAL`, and `SAFETY_BLOCKED` lanes. Apply the lock rules in [`references/resource-lock-model.md`](references/resource-lock-model.md); menu or module locality never proves safety. READ-only and namespace-separated mutations may run independently. Shared runtime, DummyCar, process/map/strategy state, task dispatch/execution/cancel/resend, WCS/feedback, and full workflows run one-at-a-time in dependency order. A parallel phase must pass `PARALLEL_PHASE_RECONCILIATION_GATE` before the stateful lane.

Each Web worker owns an independent BrowserContext/Browser Session, Page, cookie jar, storage-state copy, agent session, execution context, namespace, and artifact directory. Workers clean only their own namespace and write only their worker directory; they submit catalog proposals instead of editing global catalog files. The orchestrator alone writes the assignment registry, formal/global results, merged evidence and defects, coverage, canonical reports, and final summary. Use the contracts in [`references/multi-agent-orchestration.md`](references/multi-agent-orchestration.md), [`references/worker-contract.md`](references/worker-contract.md), [`references/result-reconciliation.md`](references/result-reconciliation.md), and [`references/cleanup-ownership.md`](references/cleanup-ownership.md).

The Worker contract records `ArtifactRoot`, `TestDataNamespace`, `ResourceLocks`, and `GlobalReportWrites=false`; the final single writer is `TEST_ORCHESTRATOR`.

Do not dispatch new work after `SNAPSHOT_DRIFT` or a global stop condition. Send `SAFE_STOP`; preserve atomic evidence and cleanup. Ordinary worker `FAIL`/`ERROR` is isolated. Reconcile duplicate results as `RESULT_CONFLICT`, retain retry attempts, deduplicate defects by fingerprint, recompute counts from canonical case results, then run global cleanup and final validators. Do not start a full product formal run merely to validate this orchestration Skill; use the deterministic helper and its synthetic self-test.

## Status and classification contract

Use only `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, and `SKIPPED` as final TestCase `ExecutionStatus` values. `NOT_APPLICABLE` belongs to `ApplicabilityStatus` or `CoverageStatus`, not execution. Use `BLOCKED_EXPECTATION` and `BLOCKED_TEST_DATA` as blocker reasons, not statuses. `PRODUCT_CHANGE_RECOMMENDED` is diagnostic only. Use `DESIGN_RUNTIME_MISMATCH` for a conflict between runtime behavior and the read-only Handoff Expected baseline.

Only an actually executed, evidence-backed result can be PASS or FAIL. Classify setup and infrastructure issues separately: `ERROR_LOCATOR`, `ERROR_TIMEOUT`, `ERROR_NAVIGATION`, `ERROR_BROWSER`, `ERROR_PLAYWRIGHT`, `ERROR_API_HARNESS`, `ERROR_TEST_DATA_SETUP`, `ERROR_CLEANUP`, and `ERROR_EVIDENCE_CAPTURE`. A missing browser, credential, service, endpoint, or safe test data is BLOCKED, not a product FAIL.

## Web, API, data, and cleanup rules

- Locator order: role, label, placeholder, existing test id, stable visible text, stable id/name, stable CSS. Runtime DOM is the authority. Weak locators are recorded as `LocatorStability=WEAK` plus `PRODUCT_CHANGE_RECOMMENDED`; never edit the product to add a test id.
- Use Playwright auto-waiting and condition-based waits. Do not use fixed screen coordinates, large sleeps, absolute XPath, `nth-child`, or index-only selectors as the formal strategy. Upload files with `setInputFiles`.
- API cases derive from `06-api-contracts.md`, not source guessing. Record method, path, status, expected/actual, duration, and sanitized response summary; never retain sensitive headers.
- Test data names use `AUTO_TEST_<FEATURE>_<RunId>`. Use only clean test-created data and clean it up. Destructive actions require an approved safe target and verified cleanup plan; otherwise use `BLOCKED_TEST_DATA`.
- Start only processes owned by the current run, record PIDs, and close only those PIDs. Never issue broad image-name kills.
- Warnings, favicon 404, and unrelated console noise do not automatically fail a case. A key API 500 or request failure affects the case when it affects the tested behavior.

## Required outputs

Under `output_root`, create or update the following as applicable: `regression-report.md`, `coverage-report.md`, `defect-list.md`, `defect-feedback/<DefectId>.md`, `execution-summary.md`, `design-runtime-mismatch.md`, `manual-boundaries.md`, `evidence-index.md`, and `environment-issues.md`. `defect-list.md` is the index: every row must link to exactly one detailed defect feedback record. Store evidence under `artifacts/web/<TestCaseId>/<RunId>/` or the corresponding API/manual directory. Keep a development feedback pack that summarizes the same results.

Use the templates in [`templates/`](templates/) and the detailed rules in [`references/`](references/). Run [`scripts/validate_contract.py`](scripts/validate_contract.py) for static contract checks and [`scripts/self_test.py`](scripts/self_test.py) for the Mock Handoff/Fake Runtime self-test. These scripts do not execute a real business test.

## References

- [Black-box contract](references/black-box-contract.md)
- [Coverage and traceability](references/coverage-and-traceability.md)
- [Execution rules](references/execution-rules.md)
- [Evidence rules](references/evidence-rules.md)
- [Test data and cleanup](references/test-data-and-cleanup.md)
- [Feedback contract](references/feedback-contract.md)
- [Runtime health and errors](references/runtime-health-and-errors.md)
- [Security sanitization](references/security-sanitization.md)
- [Multi-agent orchestration](references/multi-agent-orchestration.md)
- [Resource lock model](references/resource-lock-model.md)
- [Worker contract](references/worker-contract.md)
- [Result reconciliation](references/result-reconciliation.md)
- [Cleanup ownership](references/cleanup-ownership.md)

## Templates

- [Coverage matrix](templates/coverage-matrix.md)
- [Web TestCase](templates/web-testcase.md), [API TestCase](templates/api-testcase.md), [Manual TestCase](templates/manual-testcase.md)
- [Composite TestCase](templates/composite-testcase.md), [ScenarioSuite](templates/scenario-suite.md)
- [Regression report](templates/regression-report.md), [Coverage report](templates/coverage-report.md), [Defect list index](templates/defect-list.md), [Per-defect feedback](templates/defect-feedback.md)
- [Design-runtime mismatch](templates/design-runtime-mismatch.md), [Execution summary](templates/execution-summary.md), [Manual boundaries](templates/manual-boundaries.md)
- [Evidence index](templates/evidence-index.md), [Environment issues](templates/environment-issues.md)
