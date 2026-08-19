# WHITEBOX-TEST-EXECUTION Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task with review checkpoints.

**Goal:** Create and validate a reusable `whitebox-test-execution` Codex Skill for source-driven Unit, Integration, API, Web UI, Desktop, and Manual testing, with traceable baselines, gates, evidence, diagnosis, and regression reporting.

**Architecture:** Add a standalone Skill under `skills/whitebox-test-execution/`. Keep `SKILL.md` workflow-oriented, put detailed source/coverage/layer/safety/alignment contracts in references, put output shapes in templates, and use standard-library Python scripts for deterministic contract and Mock Source/Fake Runtime validation. Add only a small three-Skill mode section to `README.md`; do not refactor existing Skills.

**Tech Stack:** UTF-8 Markdown, YAML, Python 3 standard library, existing Playwright/API/Avalonia harness guidance, official Skill Creator initializer and validator.

## Global Constraints

- `dev-test-handoff` remains Source → As-Built → Test Handoff and does not execute tests.
- `test-execution` remains Test Handoff → black-box Web/API/Manual execution and does not use source to rewrite Expected.
- `whitebox-test-execution` accepts source directly, does not require Test Handoff, and owns source-driven testing end to end.
- Product source is readable but read-only; all test-owned files stay in `E:\automated-testing`.
- Do not modify product code, AutomationId, data-testid, DI, test hooks, InternalsVisibleTo, access modifiers, configuration, API, database, or Mock switches to make tests pass.
- Do not read or execute real business source, runtime, localhost, API, browser, desktop, or production resources during Skill creation.
- Preserve the existing dirty worktree; stage only the new Skill, its validation resources, the implementation plan/spec if explicitly intended, and the small README synchronization.
- Final statuses are `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, `NOT_APPLICABLE`, and `SKIPPED`.
- Coverage states are `COVERED_PASS`, `COVERED_FAIL`, `COVERED_ERROR`, `BLOCKED`, `MANUAL_PENDING`, `NOT_APPLICABLE`, and `NOT_COVERED`.
- `ExpectedBasis`, `Baseline Validation Gate`, `Source/Runtime Alignment Gate`, status-contract compatibility, and non-invasive Code Coverage are required contracts.
- Do not push without fresh explicit authorization for this task.

## File Map

Create:

- `skills/whitebox-test-execution/SKILL.md`: trigger, boundaries, 14-phase workflow, gate order, resource routing.
- `skills/whitebox-test-execution/agents/openai.yaml`: discoverable UI metadata and source-driven default prompt.
- `skills/whitebox-test-execution/references/whitebox-contract.md`: inputs, direct-source mode, three-Skill boundary, ExpectedBasis, and source safety.
- `skills/whitebox-test-execution/references/source-analysis-and-risk.md`: inventory passes, facts, IDs, branches, risk, unknowns, and SourceEvidence.
- `skills/whitebox-test-execution/references/baseline-validation-gate.md`: White-box Baseline completeness and failure contract.
- `skills/whitebox-test-execution/references/source-runtime-alignment-gate.md`: ExpectedBasis alignment, Runtime comparison, and mismatch handling.
- `skills/whitebox-test-execution/references/coverage-and-traceability.md`: business/technical coverage and Source → TestCase → Evidence trace.
- `skills/whitebox-test-execution/references/test-layer-selection.md`: Unit/Integration/API/Web/Desktop/Manual choice and de-duplication.
- `skills/whitebox-test-execution/references/testcase-design.md`: TestCase-first fields, review gate, and unknown expectations.
- `skills/whitebox-test-execution/references/harness-safety.md`: external harness, no ProjectReference artifacts, runtime health, and test doubles.
- `skills/whitebox-test-execution/references/evidence-rules.md`: layer-specific evidence and sanitization reuse.
- `skills/whitebox-test-execution/references/root-cause-analysis.md`: failure diagnosis and confidence levels.
- `skills/whitebox-test-execution/references/test-data-and-cleanup.md`: generated data, destructive gate, cleanup ownership, and external dependencies.
- `skills/whitebox-test-execution/references/regression-contract.md`: statuses, reconciliation, P0 gate, incremental modes, and non-invasive Code Coverage.
- `skills/whitebox-test-execution/references/security-sanitization.md`: secrets, customer data, source paths, and artifact sanitization.
- `skills/whitebox-test-execution/templates/whitebox-baseline.md`: source-derived testing baseline with ExpectedBasis and gate result.
- `skills/whitebox-test-execution/templates/coverage-matrix.md`: all source/business/technical dimensions, layers, TestCase, and status.
- `skills/whitebox-test-execution/templates/unit-testcase.md`: Unit TestCase with SourceEvidence.
- `skills/whitebox-test-execution/templates/integration-testcase.md`: Integration TestCase with dependency and isolation evidence.
- `skills/whitebox-test-execution/templates/api-testcase.md`: API TestCase and contract evidence.
- `skills/whitebox-test-execution/templates/web-testcase.md`: Playwright Web TestCase.
- `skills/whitebox-test-execution/templates/desktop-testcase.md`: Headless/Desktop E2E TestCase with Avalonia boundaries.
- `skills/whitebox-test-execution/templates/manual-testcase.md`: Manual-only TestCase.
- `skills/whitebox-test-execution/templates/whitebox-regression-report.md`: complete white-box report.
- `skills/whitebox-test-execution/templates/coverage-report.md`: reconciliation and P0 coverage gate.
- `skills/whitebox-test-execution/templates/defect-list.md`: defect, SourceEvidence, impact, and root-cause confidence.
- `skills/whitebox-test-execution/templates/root-cause-analysis.md`: failure-to-source analysis.
- `skills/whitebox-test-execution/templates/execution-summary.md`: run metadata, layer totals, and overall result.
- `skills/whitebox-test-execution/templates/evidence-index.md`: TestCase-to-evidence map.
- `skills/whitebox-test-execution/templates/environment-issues.md`: health blockers and harness errors.
- `skills/whitebox-test-execution/templates/manual-boundaries.md`: manual and unsupported boundaries.
- `skills/whitebox-test-execution/scripts/self_test.py`: Mock Source + Fake Runtime behavior self-test.
- `skills/whitebox-test-execution/scripts/validate_contract.py`: static file, phrase, link, status, gate, and safety validator.
- `docs/superpowers/plans/2026-08-19-whitebox-test-execution.md`: this implementation plan.

Modify:

- `README.md`: only add a concise three-Skill responsibility table and Mode A/Mode B flow.

Do not modify:

- `skills/dev-test-handoff/**`
- `skills/test-execution/**`
- product sources, runtimes, browser binaries, traces, screenshots, or real business artifacts.

## Task 1: Establish RED pressure scenarios

- [ ] Create a temporary fixture outside the repository at `%TEMP%\\whitebox-test-execution-baseline` with Mock Frontend Source, Mock Backend Source, a missing business meaning, a changed runtime behavior, a fake external dependency, and a non-invasive Code Coverage report.
- [ ] Write a temporary baseline probe that expects the pre-Skill behavior to be unsafe or incomplete: it may skip `ExpectedBasis`, treat source as runtime proof, use only Web UI, write into product source, use incompatible statuses, or claim code coverage as business coverage.
- [ ] Run the probe before creating the Skill and preserve the observed RED output outside Git. The probe must not call a real endpoint or read a real business path.

## Task 2: Initialize the Skill skeleton

- [ ] Run the official initializer:

```powershell
python C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\init_skill.py whitebox-test-execution --path E:\automated-testing\skills --resources scripts,references
```

- [ ] Replace generated placeholder `SKILL.md` content with a description beginning `Use when...`, an overview, input boundary, three-Skill boundary, and phase routing.
- [ ] Generate `agents/openai.yaml` with `display_name=Whitebox Test Execution`, a 25–64 character short description, and a default prompt that says source is readable but product source is read-only and Test Handoff is optional.
- [ ] Confirm initializer output is UTF-8 and remove any generated placeholder/example files before adding maintained content.

## Task 3: Implement the entrypoint and mandatory gates

- [ ] Write `SKILL.md` so the workflow order is exactly Source Intake → White-box Analysis → Test Baseline → Coverage → TestCase → Review Gate → Layer Selection → Harness → Runtime Health → Execution → Evidence → Failure Diagnosis → Reconciliation → Reporting.
- [ ] Make `ExpectedBasis` mandatory on every baseline, Coverage row, TestCase, and report. Allowed values are `CONFIRMED_FROM_CODE`, `CONFIRMED_FROM_RUNTIME`, `INFERRED`, and `UNKNOWN`; source analysis may establish Expected behavior, while runtime only confirms observed Actual behavior.
- [ ] Route missing or ambiguous facts to `UNKNOWN`, `UNKNOWN_EXPECTATION`, `BLOCKED`, or `PRODUCT_CHANGE_RECOMMENDED`; never manufacture a business meaning from a status literal.
- [ ] Require `Baseline Validation Gate` before Coverage/TestCase generation. Its result must be `BASELINE_VALIDATED` or `BASELINE_INCOMPLETE`, with Missing, Reason, Impact, and affected scope.
- [ ] Require `Source/Runtime Alignment Gate` before PASS/FAIL aggregation. It must compare ExpectedBasis/source Expected with supplied runtime Actual, preserve mismatches as `DESIGN_RUNTIME_MISMATCH` or `SOURCE_RUNTIME_MISMATCH`, and never rewrite source-derived Expected to fit runtime.
- [ ] State that only executed cases may be PASS/FAIL, source correctness is not execution proof, and all final statuses must remain compatible with the existing `test-execution` contract.
- [ ] Route detailed rules through all references listed in the File Map; keep `SKILL.md` workflow-focused.

## Task 4: Add reference contracts

- [ ] Write `whitebox-contract.md` for direct source input, frontend-only/backend-only, multi-solution inventory, optional Handoff, ExpectedBasis, source read-only, and three-Skill boundaries.
- [ ] Write `source-analysis-and-risk.md` for seven inventory passes, stable IDs, confidence vocabulary, SourceEvidence, business/branch/error/state/permission risk, and unknown semantics.
- [ ] Write `baseline-validation-gate.md` with required inventories and the exact `BASELINE_VALIDATED` / `BASELINE_INCOMPLETE` contract.
- [ ] Write `source-runtime-alignment-gate.md` with gate inputs, alignment outcomes, mismatch markers, precedence, and no-Expected-rewrite rule.
- [ ] Write `coverage-and-traceability.md` with business, rule, flow, validation, state, API, permission, automation, execution, optional code coverage, and full ID chain.
- [ ] Write `test-layer-selection.md` with the seven supported layers, existing harness reuse, testing-pyramid choice, and layer de-duplication.
- [ ] Write `testcase-design.md` with required fields, `SourceEvidence`, `ExpectedBasis`, TestCase-first ordering, Review Gate, and `UNKNOWN_EXPECTATION`.
- [ ] Write `harness-safety.md`, `test-data-and-cleanup.md`, and `security-sanitization.md` for repository-only adapters, no ProjectReference output, health checks, safe data, destructive gates, and secret handling.
- [ ] Write `evidence-rules.md` and `root-cause-analysis.md` for Unit/Integration/API/Web/Desktop/Manual evidence and `ROOT_CAUSE_CONFIRMED`, `ROOT_CAUSE_PROBABLE`, `ROOT_CAUSE_UNKNOWN`.
- [ ] Write `regression-contract.md` for final statuses, coverage states, P0 `NOT_COVERED` gate, six execution modes, and non-invasive Code Coverage: read existing reports or run coverage only with test-owned output/configuration, never modify product source/configuration or use coverage to replace business coverage.

## Task 5: Add output templates

- [ ] Add `whitebox-baseline.md` with Source Inventory, ExpectedBasis, Baseline Validation Gate, source facts, risks, unknowns, SourceEvidence, and Testability.
- [ ] Add `coverage-matrix.md` with ModuleId, FeatureId, RuleId, FlowId, ApiId, ValidationId, StateId, Source Risk, Business Risk, Priority, ExpectedBasis, seven test-layer columns, TestCaseId, status, reconciliation, and evidence.
- [ ] Add Unit, Integration, API, Web, Desktop, and Manual TestCase templates with the common fields plus SourceEvidence, ExpectedBasis, layer-specific setup, evidence, cleanup, and limitations.
- [ ] Add `whitebox-regression-report.md`, `coverage-report.md`, `defect-list.md`, `root-cause-analysis.md`, `execution-summary.md`, `evidence-index.md`, `environment-issues.md`, and `manual-boundaries.md` with all required metadata and gate fields.
- [ ] Ensure templates contain no TODO/TBD placeholders and do not contain real business paths, credentials, screenshots, traces, or customer data.

## Task 6: Implement RED/GREEN self-test and validator

- [ ] Write the failing self-test assertions before completing implementation. The self-test must create a temporary Mock Source and Fake Runtime, then assert Source Intake, stable IDs, source-only Baseline, `ExpectedBasis`, Baseline Validation Gate, Source/Runtime Alignment Gate, layer selection, TestCase-first/Review Gate, status compatibility, evidence, root-cause confidence, reconciliation, P0 gate, and non-invasive Code Coverage.
- [ ] Run the self-test before the final implementation and confirm it fails for the intended missing-contract reason, not a Python syntax error.
- [ ] Implement `self_test.py` with standard library only. It must never call a real endpoint, read a real business path, create a browser trace, or write outside a temporary directory.
- [ ] Implement `validate_contract.py` to verify frontmatter, description trigger, required references/templates/scripts, linked paths, no placeholders, all final statuses, all reconciliation states, `ExpectedBasis`, both gates, `SOURCE_RUNTIME_ALIGNMENT`, `BASELINE_VALIDATED`, `BASELINE_INCOMPLETE`, `CODE_COVERAGE_NON_INVASIVE`, three-Skill boundary phrases, and no credential/real-business-path literals.
- [ ] Run the validator and self-test, then close any loophole found by the fixture without weakening existing repository contracts.

## Task 7: Synchronize README without redesigning it

- [ ] Add a small section to `README.md` describing:

```text
Mode A: Source → DEV-TEST-HANDOFF → Test Handoff → TEST-EXECUTION
Mode B: Source → WHITEBOX-TEST-EXECUTION → White-box Regression
```

- [ ] State that `dev-test-handoff` does not execute tests, `test-execution` consumes Handoff for black-box execution, and `whitebox-test-execution` directly drives testing from read-only source.
- [ ] Do not change existing phase reports, commands, or Avalonia boundaries.

## Task 8: Validate, review scope, and commit

- [ ] Run `python skills/whitebox-test-execution/scripts/validate_contract.py` and expect `PASS`.
- [ ] Run `python skills/whitebox-test-execution/scripts/self_test.py` and expect a JSON `status` of `PASS` with `real_business_test_executed` equal to `false`.
- [ ] Run the official validator:

```powershell
python C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\quick_validate.py skills/whitebox-test-execution
```

- [ ] Run a UTF-8 decode check over all new Markdown, YAML, and Python files; scan for credentials, real business paths, traces, screenshots, browser binaries, `node_modules`, and TODO/TBD.
- [ ] Run `git diff --check`, inspect `git diff --cached --name-only`, and verify only `skills/whitebox-test-execution/**` plus the intended README/spec/plan files are staged.
- [ ] Run the GREEN pressure probe against the same Mock Source/Fake Runtime scenarios and record that all mandatory gates and safety decisions are present.
- [ ] Run `git status --short`, `git rev-list --left-right --count origin/main...HEAD`, and `git log -1 --oneline`. Preserve unrelated dirty files and do not push without fresh authorization.
- [ ] Commit the Skill and README synchronization with `feat: add white-box test execution skill` after all checks pass.

## Plan self-review

- [ ] `ExpectedBasis` is required in the entrypoint, baseline template, Coverage Matrix, TestCase templates, reports, validator, and self-test.
- [ ] `Baseline Validation Gate` is distinct from `Source/Runtime Alignment Gate`, and both have explicit failure behavior.
- [ ] Final status vocabulary matches the existing `test-execution` Skill; coverage reconciliation is separate from final execution status.
- [ ] Code Coverage is explicitly optional, non-invasive, test-owned, and subordinate to business coverage.
- [ ] The plan contains no real business path, credential, or runtime acceptance command.
- [ ] The README change is scoped to a small three-Skill mode explanation.
