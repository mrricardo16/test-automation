# PLATFORM-04 Synthetic API Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable Playwright APIRequestContext harness that executes only against the test-owned Synthetic Product runtime and emits canonical API execution/evidence artifacts.

**Architecture:** A shared TypeScript fixture starts `scripts/platform/synthetic-runtime.mjs` on a dynamic loopback port, exposes `RuntimeHandle.apiBaseUrl`, resets only Synthetic state, and verifies shutdown. Four TestCase-first specs use a shared request/evidence helper; each request writes sanitized request, response, and canonical execution summaries under ignored `artifacts/api/<TestCaseId>/<RunId>/`.

**Tech Stack:** Playwright Test, Playwright APIRequestContext, TypeScript, existing Synthetic Runtime, existing PLATFORM-01 canonical validator.

## Global Constraints

- Implement PLATFORM-04 only; do not implement PLATFORM-05 or later stages.
- Test only `fixtures/synthetic-product/` through `scripts/platform/synthetic-runtime.mjs`.
- Use dynamic `RuntimeHandle.apiBaseUrl`; never hardcode a port or real business URL.
- Preserve existing user changes, untracked files, and `skills/dev-test-handoff/scripts/__pycache__/`.
- Stage with an explicit PLATFORM-04 file allowlist; never use `git add .` or `git add -A`.
- Do not modify the three existing Skills, real product source, real DLLs, databases, credentials, or `config/local-projects.json`.
- Every formal API test has a preceding `TC-SYN-API-*` record and a title containing its TestCaseId.
- Product failures remain `ExecutionStatus=FAIL`; an expected product defect may independently produce `GateStatus=PASS`.
- API evidence is sanitized and must not contain authorization, cookie, token, password, secret, connection string, or full sensitive bodies.
- Canonical statuses remain `PASS | FAIL | ERROR | BLOCKED | MANUAL | SKIPPED`.

---

### Task 1: API TestCase contracts

**Files:**
- Create: `test-cases/synthetic/TC-SYN-API-CRUD-001.md`
- Create: `test-cases/synthetic/TC-SYN-API-AUTH-001.md`
- Create: `test-cases/synthetic/TC-SYN-API-ERRORS-001.md`
- Create: `test-cases/synthetic/TC-SYN-API-BOUNDARY-001.md`

- [ ] Record the four unique TestCaseIds before writing executable specs. Each record must state API method/path, ExpectedBasis, ApplicabilityStatus, Expected Result, and evidence expectations.
- [ ] Verify the records contain only Synthetic Product contracts already exposed by the runtime: items CRUD, auth/permissions, validation, state conflict, 400/401/403/404/409/500, feature flag, and known bug.

### Task 2: Red API specs

**Files:**
- Create: `tests/api/synthetic/TC_SYN_API_CRUD_001.spec.ts`
- Create: `tests/api/synthetic/TC_SYN_API_AUTH_001.spec.ts`
- Create: `tests/api/synthetic/TC_SYN_API_ERRORS_001.spec.ts`
- Create: `tests/api/synthetic/TC_SYN_API_BOUNDARY_001.spec.ts`
- Create: `tests/api/synthetic/playwright.config.ts`

- [ ] Write Playwright APIRequestContext tests using the shared fixture import path before creating that fixture.
- [ ] Run `npx playwright test --config=tests/api/synthetic/playwright.config.ts --reporter=line` and confirm the expected RED failure is a missing fixture module, not a runtime or product failure.

### Task 3: Minimal reusable fixture and evidence

**Files:**
- Create: `tests/api/synthetic/api-fixtures.ts`
- Create: `tests/api/synthetic/helpers/api-evidence.ts`

- [ ] Implement `startApiHarness()` with `startSyntheticRuntime({ port: 0 })`, `ownedProcess=true`, `apiBaseUrl`, health verification, and an idempotent close that verifies `shutdownVerified`.
- [ ] Implement reset through `POST ${runtime.baseUrl}/__control/reset` with `x-synthetic-control: reset-only`; never reset a non-Synthetic URL.
- [ ] Implement request recording with method, sanitized path, expected/actual status, duration, canonical status fields, TestCaseId, EvidenceIds, and timestamp.
- [ ] Write only sanitized summaries to `artifacts/api/<TestCaseId>/<RunId>/request-summary.json`, `response-summary.json`, and `execution-result.json`; validate execution results with `validateExecutionResult`.
- [ ] Keep `EXPECT_PRODUCT_FAIL` known-bug evidence as `ExecutionStatus=FAIL` and evaluate its acceptance gate independently as PASS.

### Task 4: Green API coverage

**Files:**
- Modify: `tests/api/synthetic/TC_SYN_API_CRUD_001.spec.ts`
- Modify: `tests/api/synthetic/TC_SYN_API_AUTH_001.spec.ts`
- Modify: `tests/api/synthetic/TC_SYN_API_ERRORS_001.spec.ts`
- Modify: `tests/api/synthetic/TC_SYN_API_BOUNDARY_001.spec.ts`

- [ ] Execute GET/POST/PATCH/DELETE with GET-after-create/update/delete consistency checks and Synthetic reset.
- [ ] Verify valid authentication, unauthenticated 401, Viewer read/write distinction, and Admin write 403/201 behavior with stable error codes.
- [ ] Verify 400 validation, 404 missing resource, 409 invalid state transition, 500 controlled error, and known-bug separation with stable response contract fields.
- [ ] Verify required, empty, null, max length, over-limit, invalid state, and feature-flag boundary cases without inventing unsupported requirements.
- [ ] Run the four API specs and confirm GREEN.

### Task 5: Documentation and report

**Files:**
- Modify: `tests/api/README.md`
- Create: `reports/synthetic-api-harness.md`

- [ ] Document Playwright APIRequestContext, Synthetic-only scope, dynamic runtime ownership, TestCase-first rule, canonical results, and ignored evidence paths.
- [ ] State that real project APIs are not configured or executed and that this is not real product API acceptance.
- [ ] Record the complete required validation matrix and actual commands/results without converting product FAIL into PASS.

### Task 6: Regression, scope review, and commit

**Files:**
- No additional implementation files.

- [ ] Run API tests, PLATFORM-01, PLATFORM-02, PLATFORM-03, three Skill self-tests/validators, UTF-8 scan, dependency safety scan, and `git diff --check`.
- [ ] Confirm no evidence files are staged and no real project paths or credentials are referenced by executable files.
- [ ] Stage only PLATFORM-04 files with an explicit allowlist and run `git diff --cached --check`.
- [ ] Commit exactly `feat: add synthetic API test harness`; do not push; verify `origin/main...HEAD = 0 4`.

## Plan Self-Review

- Spec coverage: Tasks 1–4 cover TestCase-first, APIRequestContext, runtime lifecycle, CRUD, auth, validation, error matrix, boundaries, consistency, known bug, evidence, and canonical contracts. Task 5 covers README/reporting. Task 6 covers all regressions and Git safety requirements.
- Placeholder scan: No implementation step relies on an unspecified dependency, future placeholder, or real-project fixture.
- Type consistency: `startApiHarness()` returns the existing RuntimeHandle shape; API recording accepts canonical status fields and calls the existing `validateExecutionResult` contract validator; all specs consume the same fixture and evidence interfaces.
