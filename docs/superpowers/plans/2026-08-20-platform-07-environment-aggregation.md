# PLATFORM-07 Environment Profiles and Result Aggregation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal, deterministic Environment Profile contract, canonical platform result aggregator, and independent retry/Flaky policy without changing the six-state execution contract or accessing real environments.

**Architecture:** Environment profiles are schema-validated JSON records loaded only from an explicitly selected profile file; the loader never falls back to `config/local-projects.json`. The aggregator consumes canonical execution/coverage/evidence inputs, derives separate execution, applicability, coverage, baseline, alignment, gate, evidence, acceptance, defect, and Flaky summaries, and writes JSON as source of truth plus Markdown as a render. Retry history is retained as data and classified by a standalone policy module.

**Tech Stack:** TypeScript, JSON Schema, Playwright Test fixtures, Node filesystem APIs, existing canonical contract types and validators.

## Global Constraints

- Implement PLATFORM-07 only; do not implement PLATFORM-08, Agent Invocation, Windows self-hosted CI, real-project CI, production profiles, auto-retry, sharding, or multi-browser execution.
- Preserve `PASS`, `FAIL`, `ERROR`, `BLOCKED`, `MANUAL`, and `SKIPPED` as the only `ExecutionStatus` values.
- Keep Business Test Result, Platform Gate Result, Coverage, Applicability, and Environment Capability as separate fields.
- Synthetic profiles may use only test-owned dynamic localhost; no real localhost, real DLL, database, source tree, credentials, or `config/local-projects.json`.
- Aggregation must preserve product `FAIL`; `EXPECT_PRODUCT_FAIL` is an acceptance classification, not a product PASS conversion.
- `CODE_BEHAVIOR` remains characterization/implementation-regression only and never requirements compliance.
- Do not modify the three existing Skills or `.github/workflows/test-platform.yml`.
- Preserve all existing user modifications and untracked files; stage only an explicit PLATFORM-07 allowlist and do not push.

---

### Task 1: TestCase-first RED fixtures

**Files:**
- Create: `test-cases/platform/TC-PLATFORM-07-ENV-001.md`
- Create: `test-cases/platform/TC-PLATFORM-07-AGG-001.md`
- Create: `test-cases/platform/TC-PLATFORM-07-FLAKY-001.md`
- Create: `tests/platform/environment-profile.spec.ts`
- Create: `tests/platform/platform-aggregation.spec.ts`

- [ ] Record the three TestCases before formal test code.
- [ ] Add RED tests for valid `synthetic-ci`, forbidden CI real path/secret rejection, missing capability, known product FAIL aggregation, unexpected product FAIL, limited/incomplete baseline, source/runtime mismatch, missing evidence, and FAIL→PASS retry history.
- [ ] Run the focused Playwright files before implementation and confirm the expected module-not-found RED result.

### Task 2: Environment Profile contract and loader

**Files:**
- Create: `config/environments.example.json`
- Create: `contracts/schemas/environment-profile.schema.json`
- Create: `scripts/platform/load-environment.ts`
- Modify: `tsconfig.platform.json`, `eslint.config.mjs`

- [ ] Define `EnvironmentType`, `Capability`, `EnvironmentProfile`, and `loadEnvironment(environmentId, profilePath?)`.
- [ ] Validate required fields and reject unknown environment IDs, missing capabilities, CI profiles with real paths/URLs, and secret-looking values.
- [ ] Make `synthetic-ci` explicit with dynamic URL markers, `WEB`/`API`, `DesktopRuntime: false`, `DestructiveAllowed: true`, `TEST_OWNED_ONLY`, and `SANITIZED`.
- [ ] Include only placeholder-based `real-project.example`; never load local-projects automatically.

### Task 3: Flaky policy and retry contract

**Files:**
- Create: `scripts/platform/flaky-policy.ts`
- Modify: `scripts/platform/contract-types.ts`, `scripts/platform/validate-contracts.ts`, `contracts/schemas/execution-result.schema.json`

- [ ] Add independent `FlakyClassification` values and optional `attemptCount`, `attempts`, `firstFailureEvidence`, `retryResult`, and `FlakyClassification` fields.
- [ ] Implement `classifyFlakyResult` so one-attempt expected product failure is `NOT_FLAKY`, FAIL→PASS is `FLAKY_PASS`, first failure evidence is retained, and no retry is automatically started.
- [ ] Validate retry metadata without changing the canonical six execution statuses.

### Task 4: Aggregator and output renderers

**Files:**
- Create: `scripts/platform/aggregate-results.ts`
- Modify: `tsconfig.platform.json`, `eslint.config.mjs`, `.gitignore`

- [ ] Implement pure `aggregateResults(input)` and `writeAggregatedReport(input, outputRoot?)`.
- [ ] Produce `artifacts/platform/<RunId>/platform-summary.json` and ignored `reports/generated/platform-summary.md`.
- [ ] Count execution, applicability, coverage, baseline, alignment, gate, acceptance, evidence, and Flaky dimensions independently.
- [ ] Compute `PASS`, `PASS_WITH_LIMITATIONS`, `FAIL`, or `BLOCKED` using unexpected failures, blocking statuses, P0 uncovered coverage, evidence completeness, baseline, alignment, environment validity, and gate state.
- [ ] Preserve known Bug as `ProductFailures=1`, `ExpectedProductFailures=1`, `AcceptanceGateFailures=0`, and non-failing overall result when no other blocker exists.
- [ ] Mark an unexpected `EXPECT_PASS` FAIL as overall `FAIL`; never infer status from a raw FAIL string alone.

### Task 5: Commands and deterministic platform fixtures

**Files:**
- Modify: `scripts/platform/run-platform-tests.mjs`, `scripts/platform/run-platform-quality.mjs`, `package.json`

- [ ] Add `profiles` and `aggregation` focused suites and `npm run test:profiles` / `npm run test:aggregation`.
- [ ] Add both deterministic suites to the end of `test:platform` without rerunning Synthetic Web/API suites.
- [ ] Do not add Playwright retries or modify the GitHub Actions workflow.

### Task 6: Validation, report, and commit

**Files:**
- Create: `reports/platform-07.md`

- [ ] Run focused RED→GREEN tests and the required PLATFORM-01–06 regression matrix.
- [ ] Verify UTF-8, schema parsing, no real references, no Skill/workflow changes, and `git diff --check`.
- [ ] Stage only PLATFORM-07 files, commit `feat: add environment profiles and result aggregation`, do not push, and verify actual `origin/main...HEAD` divergence.

## Plan Self-Review

- Spec coverage: Environment schema/loader/capabilities are Task 2; aggregation dimensions, known/unexpected failures, coverage/baseline/alignment/evidence/overall semantics are Task 4; retry history and Flaky distinction are Task 3; commands, regressions, and Git boundaries are Tasks 5–6.
- No workflow dependency: `.github/workflows/test-platform.yml` remains unchanged; `test:platform` locally runs deterministic profile/aggregation fixtures through the existing CI entry point.
- No real-environment path: committed profiles contain only `dynamic` or angle-bracket placeholders, and the loader rejects CI unsafe values.
- No placeholder implementation steps remain; every task identifies concrete files, interfaces, tests, and verification commands.
