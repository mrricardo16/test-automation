---
name: test-execution
description: "Use when executing black-box Web, API, or Manual tests from a validated DEV-TEST-HANDOFF pack against a supplied runtime."
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

## Required workflow

1. **Handoff Intake:** Read `00-TEST-WORKFLOW.md` first, then all related Handoff documents. Missing scope, Expected Result, prerequisite, or stable Handoff ID means `HANDOFF_INCOMPLETE`; block only the affected case or run and never guess.
2. **Coverage Analysis:** Preserve every Handoff ID and map Module, Feature, Business Rule, Business Flow, Validation, Boundary, Permission, State, API, Error Path, Data Consistency, UI Observable Result, Priority, Suggested Test Layer, TestCase, and Execution Status.
3. **TestCase Design:** Create or reuse a stable TestCase before automation. Use `TC-WEB-*`, `TC-API-*`, or `TC-MANUAL-*`; include ModuleId, FeatureId, Title, Priority, TestType, Covers, Preconditions, TestData, Steps, ExpectedResult, AutomationType, Environment, EvidenceRequirement, Cleanup, Status, and Limitations. Never write a formal test without its TestCaseId.
4. **TestCase Review Gate:** Before execution, verify P0/P1 coverage, explicit Expected Result, preconditions, safe test data, cleanup, destructive-operation safety, automation layer, and evidence requirements. Missing gates are blockers, not assumptions.
5. **Execution Planning:** Choose `WEB_UI`, `API`, `BOTH`, or `MANUAL`. Prefer the smallest scope requested: full regression, module regression, P0, failed rerun, or a single TestCase. Run a Runtime Health Check before formal execution.
6. **Automation or Manual Execution:** Prefer existing harnesses. For Web UI use Playwright and real user-visible interactions; for API use the Handoff API contracts; retain unsupported cases as `MANUAL`. Do not bypass the UI with hidden state, injected tokens, direct business-state JavaScript, or coordinate clicks.
7. **Evidence Collection:** Reuse the repository Web Evidence Helper. Capture failure screenshot, URL, failed step, Expected, Actual, and error stack; retain trace on failure when available. Sanitize passwords, auth headers, cookies, tokens, secrets, API keys, and sensitive network payloads.
8. **Coverage Reconciliation:** Reconcile each Handoff ID to `COVERED_PASS`, `COVERED_FAIL`, `COVERED_ERROR`, `BLOCKED`, `MANUAL_PENDING`, `NOT_APPLICABLE`, or `NOT_COVERED`. A FAIL is covered and remains a product failure. Any P0 `NOT_COVERED` prevents announcing regression complete.
9. **Regression Reporting:** Produce the reports and evidence index listed below. Keep original TestCase status when cleanup or evidence capture fails; add the secondary `ERROR_*` reason.
10. **Development Feedback Pack:** Make tested, passed, failed, blocked, manual, not covered, mismatch, evidence, and next action understandable without opening the full test repository.

## Status and classification contract

Use only `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, `NOT_APPLICABLE`, and `SKIPPED` as final TestCase execution statuses. Use `BLOCKED_EXPECTATION` and `BLOCKED_TEST_DATA` as blocker reasons, not statuses. `PRODUCT_CHANGE_RECOMMENDED` is diagnostic only. Use `DESIGN_RUNTIME_MISMATCH` for a conflict between runtime behavior and the read-only Handoff Expected baseline.

Only an actually executed, evidence-backed result can be PASS or FAIL. Classify setup and infrastructure issues separately: `ERROR_LOCATOR`, `ERROR_TIMEOUT`, `ERROR_NAVIGATION`, `ERROR_BROWSER`, `ERROR_PLAYWRIGHT`, `ERROR_API_HARNESS`, `ERROR_TEST_DATA_SETUP`, `ERROR_CLEANUP`, and `ERROR_EVIDENCE_CAPTURE`. A missing browser, credential, service, endpoint, or safe test data is BLOCKED, not a product FAIL.

## Web, API, data, and cleanup rules

- Locator order: role, label, placeholder, existing test id, stable visible text, stable id/name, stable CSS. Runtime DOM is the authority. Weak locators are recorded as `LocatorStability=WEAK` plus `PRODUCT_CHANGE_RECOMMENDED`; never edit the product to add a test id.
- Use Playwright auto-waiting and condition-based waits. Do not use fixed screen coordinates, large sleeps, absolute XPath, `nth-child`, or index-only selectors as the formal strategy. Upload files with `setInputFiles`.
- API cases derive from `06-api-contracts.md`, not source guessing. Record method, path, status, expected/actual, duration, and sanitized response summary; never retain sensitive headers.
- Test data names use `AUTO_TEST_<FEATURE>_<RunId>`. Use only clean test-created data and clean it up. Destructive actions require an approved safe target and verified cleanup plan; otherwise use `BLOCKED_TEST_DATA`.
- Start only processes owned by the current run, record PIDs, and close only those PIDs. Never issue broad image-name kills.
- Warnings, favicon 404, and unrelated console noise do not automatically fail a case. A key API 500 or request failure affects the case when it affects the tested behavior.

## Required outputs

Under `output_root`, create or update the following as applicable: `regression-report.md`, `coverage-report.md`, `defect-list.md`, `execution-summary.md`, `design-runtime-mismatch.md`, `manual-boundaries.md`, `evidence-index.md`, and `environment-issues.md`. Store evidence under `artifacts/web/<TestCaseId>/<RunId>/` or the corresponding API/manual directory. Keep a development feedback pack that summarizes the same results.

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

## Templates

- [Coverage matrix](templates/coverage-matrix.md)
- [Web TestCase](templates/web-testcase.md), [API TestCase](templates/api-testcase.md), [Manual TestCase](templates/manual-testcase.md)
- [Regression report](templates/regression-report.md), [Coverage report](templates/coverage-report.md), [Defect list](templates/defect-list.md)
- [Design-runtime mismatch](templates/design-runtime-mismatch.md), [Execution summary](templates/execution-summary.md), [Manual boundaries](templates/manual-boundaries.md)
- [Evidence index](templates/evidence-index.md), [Environment issues](templates/environment-issues.md)
