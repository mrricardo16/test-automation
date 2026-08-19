---
name: whitebox-test-execution
description: Use when readable product source must directly drive safe, traceable white-box test design, execution, and diagnosis without requiring a Test Handoff.
---

# White-box Test Execution

Create source-driven, TestCase-first regression work while keeping product source read-only. A DEV-TEST-HANDOFF is optional: this Skill does not call it to substitute for source analysis. `dev-test-handoff` creates As-Built/Handoff without execution; `test-execution` runs black-box tests from Handoff; this Skill owns direct-source white-box work end to end.

## Inputs and boundaries

Require `output_root` in the test repository and at least one of `frontend_source` or `backend_source`; mark the absent side `NOT_PROVIDED`. Support frontend-only, backend-only, multi-solution, changed-file/commit, and optional Runtime inputs. Read product source only; write adapters, reports, evidence, and coverage configuration only under test-owned output. Never modify product source, configuration, AutomationId, data-testid, DI, test hooks, InternalsVisibleTo, database, API, or mock switches.

## Required workflow

Follow this exact order: **Source Intake → White-box Analysis → Test Baseline → Coverage → TestCase → Review Gate → Layer Selection → Harness → Runtime Health → Execution → Evidence → Failure Diagnosis → Reconciliation → Reporting**.

Every Baseline, Coverage row, TestCase, and report carries `ExpectedBasis`: `CONFIRMED_FROM_CODE`, `CONFIRMED_FROM_RUNTIME`, `INFERRED`, or `UNKNOWN`. Source Expected and Runtime Actual remain distinct. Missing semantics are `UNKNOWN`/`UNKNOWN_EXPECTATION`, `BLOCKED`, or `PRODUCT_CHANGE_RECOMMENDED`, never guessed.

Before Coverage/TestCase creation, run the Baseline Validation Gate. Record `BASELINE_VALIDATED` or `BASELINE_INCOMPLETE` with Missing, Reason, Impact, and affected scope. Before aggregating PASS/FAIL, run `SOURCE_RUNTIME_ALIGNMENT`; retain `DESIGN_RUNTIME_MISMATCH` or `SOURCE_RUNTIME_MISMATCH` and never rewrite Expected.

Formal TestCases precede automation. Review Gate checks Expected, SourceEvidence, coverage mapping, layer, safe data, Cleanup, Destructive Operation, runtime prerequisites, and evidence. Select only `UNIT`, `INTEGRATION`, `API`, `WEB_UI`, `DESKTOP_HEADLESS`, `DESKTOP_E2E`, or `MANUAL`. Only real execution with evidence may be `PASS` or `FAIL`; final statuses are `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, `NOT_APPLICABLE`, `SKIPPED`.

Use separate reconciliation states: `COVERED_PASS`, `COVERED_FAIL`, `COVERED_ERROR`, `BLOCKED`, `MANUAL_PENDING`, `NOT_APPLICABLE`, `NOT_COVERED`. P0 `NOT_COVERED` prevents a regression-complete claim. Code coverage is optional and `CODE_COVERAGE_NON_INVASIVE`: read an existing report or write only test-owned output/configuration; it never replaces business coverage.

## Resource routing

- Start with [whitebox contract](references/whitebox-contract.md), [source analysis](references/source-analysis-and-risk.md), and [baseline gate](references/baseline-validation-gate.md).
- For runtime comparisons read [alignment](references/source-runtime-alignment-gate.md); for scope and reconciliation read [coverage](references/coverage-and-traceability.md) and [regression](references/regression-contract.md).
- Before TestCases/Harness read [TestCase design](references/testcase-design.md), [layer selection](references/test-layer-selection.md), [harness safety](references/harness-safety.md), and [test data](references/test-data-and-cleanup.md).
- For execution output read [evidence](references/evidence-rules.md), [root cause](references/root-cause-analysis.md), and [sanitization](references/security-sanitization.md), then use `templates/`.

Run `scripts/validate_contract.py` and `scripts/self_test.py`; they use only Mock Source + Fake Runtime and never execute a real business test.
