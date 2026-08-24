---
name: whitebox-test-execution
description: Use when readable product source must directly drive safe, traceable white-box test design, execution, and diagnosis without requiring a Test Handoff.
---

# White-box Test Execution

Create source-driven, TestCase-first regression work while keeping product source read-only. A DEV-TEST-HANDOFF is optional: this Skill does not call it to substitute for source analysis. `dev-test-handoff` creates As-Built/Handoff without execution; `test-execution` runs black-box tests from Handoff; this Skill owns direct-source white-box work end to end.

## Inputs and boundaries

Require `output_root` in the test repository and at least one of `frontend_source` or `backend_source`; mark the absent side `NOT_PROVIDED`. Support frontend-only, backend-only, multi-solution, changed-file/commit, and optional Runtime inputs. Read product source only; write adapters, reports, evidence, and coverage configuration only under test-owned output. Never modify product source, configuration, AutomationId, data-testid, DI, test hooks, InternalsVisibleTo, database, API, or mock switches.

## Canonical Contracts and compatibility

Use the repository Canonical Contracts as the source of truth: [TestCase generation V2](../../contracts/testcase-generation-standard.md), [Composite TestCase](../../contracts/composite-testcase-standard.md), [TestCase](../../contracts/testcase-contract.md), [status](../../contracts/status-contract.md), [coverage](../../contracts/coverage-contract.md), [evidence](../../contracts/evidence-contract.md), [confidence](../../contracts/confidence-contract.md), and [stable IDs](../../contracts/id-contract.md). Apply the shared V2 generation and unattended routing rules by reference; do not restate a divergent local version. `LegacyFieldAdapter` maps old field names and reconciliation values into the canonical model without rewriting historical TestCases or reports.

`ExpectedBasis` is one of `REQUIREMENT`, `DESIGN`, `APPROVED_BASELINE`, `HANDOFF_BASELINE`, `CODE_BEHAVIOR`, or `UNKNOWN`. Runtime observations belong to Actual/Observation Evidence, never `ExpectedBasis`. `CODE_BEHAVIOR` is limited to characterization or implementation-regression claims and cannot automatically assert requirements compliance. Keep `ExecutionStatus`, `ApplicabilityStatus`, `CoverageStatus`, `GateStatus`, `BaselineStatus`, `SourceRuntimeAlignment`, and `Confidence` separate.

PRODUCT SOURCE is read-only, and `CODE_COVERAGE_NON_INVASIVE` never replaces business coverage.

## Required workflow

Follow this exact order: **Source Intake → White-box Analysis → Test Baseline → Coverage → TestCase → Review Gate → Layer Selection → Harness → Runtime Health → Execution → Evidence → Failure Diagnosis → Reconciliation → Reporting**.

Every Baseline, Coverage row, TestCase, and report carries a canonical `ExpectedBasis`.

Evidence confidence is recorded separately as `CONFIRMED_FROM_CODE`, `CONFIRMED_FROM_RUNTIME`, `INFERRED`, or `UNKNOWN`. Source Expected and Runtime Actual remain distinct. Missing semantics are `UNKNOWN`/`UNKNOWN_EXPECTATION`, `BLOCKED`, or `PRODUCT_CHANGE_RECOMMENDED`, never guessed.

Before Coverage/TestCase creation, run the Baseline Validation Gate. Record `BASELINE_VALIDATED`, `BASELINE_LIMITED`, or `BASELINE_INCOMPLETE` with Missing, Reason, Impact, and affected scope. Before aggregating PASS/FAIL, run `SOURCE_RUNTIME_ALIGNMENT`; retain `DESIGN_RUNTIME_MISMATCH` or `SOURCE_RUNTIME_MISMATCH` and never rewrite Expected.

Formal TestCases precede automation. New cases use shared V2 `CaseKind`, `ScenarioSuiteId`, `Objective`, `PrimaryAssertion`, coverage tags, risk, side effects, reversibility, and `AutomationEligibility`; Composite and ScenarioSuite fields come from the canonical generation contracts. Review Gate checks Expected, SourceEvidence, coverage mapping, layer, safe data, Cleanup, Destructive Operation, runtime prerequisites, and evidence. Select only `UNIT`, `INTEGRATION`, `API`, `WEB_UI`, `DESKTOP_HEADLESS`, `DESKTOP_E2E`, or `MANUAL`. Only real execution with evidence may be `PASS` or `FAIL`; final `ExecutionStatus` values are `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, or `SKIPPED`. `NOT_APPLICABLE` is not an execution status.

Use canonical `CoverageStatus`: `COVERED`, `PARTIAL`, `UNTESTED`, `MANUAL`, or `NOT_APPLICABLE`, separately from `ExecutionStatus`; P0 `UNTESTED`/`PARTIAL` prevents a regression-complete claim. Legacy reconciliation values are accepted only through `LegacyFieldAdapter`. Code coverage is optional and `CODE_COVERAGE_NON_INVASIVE`: read an existing report or write only test-owned output/configuration; it never replaces business coverage.

## Defect feedback

Use `defect-list.md` as an index only. For every executed product FAIL, assign a stable `DefectId` and create exactly one `defect-feedback/<DefectId>.md` record. Link the index row to that record and include TestCaseId, SourceEvidence, ExpectedBasis, `ExecutionStatus`, `CoverageStatus`, `GateStatus`, classification, impact, Preconditions, `Reproduction`, Expected, Actual, Evidence, runtime and source evidence, root-cause confidence, evidence-backed affected scope, `Next action`, and `Regression scope`. Keep script `ERROR`, environment `BLOCKED`, `MANUAL`, `SKIPPED`, and source/runtime mismatch outcomes out of the defect list; they remain in their dedicated reports. Do not claim a root cause or repaired PASS without evidence.

## Resource routing

- Start with [whitebox contract](references/whitebox-contract.md), [source analysis](references/source-analysis-and-risk.md), and [baseline gate](references/baseline-validation-gate.md).
- For runtime comparisons read [alignment](references/source-runtime-alignment-gate.md); for scope and reconciliation read [coverage](references/coverage-and-traceability.md) and [regression](references/regression-contract.md).
- Before TestCases/Harness read [TestCase design](references/testcase-design.md), [layer selection](references/test-layer-selection.md), [harness safety](references/harness-safety.md), and [test data](references/test-data-and-cleanup.md).
- For execution output read [evidence](references/evidence-rules.md), [root cause](references/root-cause-analysis.md), and [sanitization](references/security-sanitization.md), then use [defect list index](templates/defect-list.md), [per-defect feedback](templates/defect-feedback.md), and the remaining `templates/`.
- For cross-step design use [Composite TestCase](templates/composite-testcase.md) and aggregate it with [ScenarioSuite](templates/scenario-suite.md).

Run `scripts/validate_contract.py` and `scripts/self_test.py`; they use only Mock Source + Fake Runtime and never execute a real business test.
