# Agent-Driven Test Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 在不破坏现有三个 Codex Skill、TestCase、真实项目安全边界和历史证据的前提下，把当前自动化测试仓库强化为具有统一契约、Synthetic Product、API Harness、跨 Skill Acceptance、CI-safe 入口和统一报告的 Agent-Driven Test Platform。

**Architecture:** 采用兼容增量方案。三个 Skill 继续作为流程入口，新增 `contracts/` 作为数据语义 Single Source of Truth，并通过 adapter 读取现有 Markdown、Skill 模板和 Web evidence helper。Synthetic Product 由测试仓库自有进程启动，使用动态 localhost 和当前测试拥有的 PID；任何真实业务 localhost、真实 DLL、真实数据库和真实源代码都不进入 CI 或 Synthetic Acceptance。

**Tech Stack:** Node.js/npm、TypeScript、Playwright Test、Playwright `APIRequestContext`、JSON Schema、GitHub Actions、现有 Python Skill self-test、PowerShell（Windows 进程/PID 生命周期）。不引入 Postman/Newman/RestAssured，不增加生产产品依赖。

## Global Constraints

- 不新增第四个 Codex Skill；保留 `dev-test-handoff`、`test-execution`、`whitebox-test-execution` 三个边界。
- 只修改 `E:\automated-testing`；`D:\HZ_RSS40\03_trunk\src_m_logclient` 和 `E:\logclient\logclient20260812\net8.0` 保持只读。
- 所有 Markdown、TypeScript、JSON、YAML 和文本文件保持 UTF-8；不得改写已有中文为乱码。
- 每个正式自动化测试必须先有唯一 TestCaseId，并在 TestCase、脚本、结果和证据中保持关联。
- 执行状态只使用 `PASS`、`FAIL`、`ERROR`、`BLOCKED`、`MANUAL`、`SKIPPED`；`NOT_APPLICABLE` 不作为执行成功状态。
- 新增 `ApplicabilityStatus`，不得用 `SKIPPED` 或 `PASS` 替代“不适用”。
- `BaselineStatus` 必须支持 `BASELINE_VALIDATED`、`BASELINE_LIMITED`、`BASELINE_INCOMPLETE`。
- Source/Runtime Alignment、ExpectedBasis、状态合同兼容和非侵入式 Code Coverage 是 White-box 结果的强制字段。
- Synthetic Product 只能使用测试仓库自身启动、拥有并关闭的动态 localhost Runtime；不得依赖现有真实业务 localhost。
- 不通过修改产品源代码、AutomationId、测试钩子、DI 或生产依赖让测试通过。
- 不把 `node_modules`、浏览器二进制、真实凭据、真实业务数据和运行时私有证据提交到 Git。
- 每个阶段都必须有独立验证命令、失败分类和可回滚边界；本计划不授权自动推送。

## Canonical Contract Decisions

```text
ExecutionStatus:
  PASS | FAIL | ERROR | BLOCKED | MANUAL | SKIPPED

ApplicabilityStatus:
  APPLICABLE | NOT_APPLICABLE | CONDITIONAL | UNKNOWN

CoverageStatus:
  COVERED | PARTIAL | UNTESTED | MANUAL | NOT_APPLICABLE

BaselineStatus:
  BASELINE_VALIDATED | BASELINE_LIMITED | BASELINE_INCOMPLETE

SourceRuntimeAlignment:
  ALIGNED | MISMATCH | UNKNOWN | NOT_APPLICABLE

ExpectedBasis:
  REQUIREMENT | DESIGN | APPROVED_BASELINE | HANDOFF_BASELINE |
  CODE_BEHAVIOR | UNKNOWN

GateStatus:
  PASS | LIMITED | FAIL

AcceptanceExpectation:
  EXPECT_PASS | EXPECT_PRODUCT_FAIL | EXPECT_BLOCKED |
  EXPECT_MANUAL | EXPECT_BASELINE_LIMITED
```

Contract rules:

1. `ApplicabilityStatus=NOT_APPLICABLE` 时，`CoverageStatus` 必须为 `NOT_APPLICABLE`，并且必须有 `ApplicabilityReason`。
2. `ApplicabilityStatus=CONDITIONAL` 时，必须有 `ApplicabilityCondition`；没有满足条件时执行状态只能是 `BLOCKED` 或 `SKIPPED`，不能是 `PASS`。
3. `BaselineStatus=BASELINE_LIMITED` 允许执行有明确边界的测试，但报告必须列出限制；不能宣称完整 White-box Regression。
4. `BaselineStatus=BASELINE_INCOMPLETE` 时，Baseline Gate 不能通过；相关结果只能为 `BLOCKED`、`ERROR` 或 `SKIPPED`，除非是与该 Baseline 无关的独立测试。
5. `SourceRuntimeAlignment=MISMATCH` 时，不能把运行时结果解释为当前源码结果；必须保留 mismatch evidence。
6. `ExpectedBasis` 只描述预期来源；Runtime Observation 必须进入 `Actual/Observation Evidence`，不得写入 `ExpectedBasis`。
7. `CODE_BEHAVIOR` 只允许用于 Characterization 或 Implementation Regression，不得自动解释为 Requirements Compliance。
8. `GateStatus=LIMITED` 表示存在明确限制但可以继续执行；它不是 `PASS` 的别名，也不能掩盖 `FAIL`。
9. `AcceptanceExpectation=EXPECT_PRODUCT_FAIL` 时，Synthetic Product 的实际结果必须保持 `ExecutionStatus=FAIL`；只有在失败证据、缺陷标识和预期匹配时，Acceptance Gate 才能得到 `GateStatus=PASS`，不得改写执行状态。
10. Code Coverage 只允许测试仓库拥有的非侵入式采集方式；不得修改、注入、替换或重新编译真实产品。

---

### PLATFORM-01: Unified Contract Registry and Compatibility Layer

**Files:**
- Create: `E:\automated-testing\contracts\status-contract.md`
- Create: `E:\automated-testing\contracts\id-contract.md`
- Create: `E:\automated-testing\contracts\confidence-contract.md`
- Create: `E:\automated-testing\contracts\testcase-contract.md`
- Create: `E:\automated-testing\contracts\coverage-contract.md`
- Create: `E:\automated-testing\contracts\evidence-contract.md`
- Create: `E:\automated-testing\contracts\schemas\testcase.schema.json`
- Create: `E:\automated-testing\contracts\schemas\execution-result.schema.json`
- Create: `E:\automated-testing\contracts\schemas\coverage.schema.json`
- Create: `E:\automated-testing\contracts\schemas\evidence-index.schema.json`
- Create: `E:\automated-testing\contracts\schemas\defect.schema.json`
- Create: `E:\automated-testing\scripts\platform\contract-types.ts`
- Create: `E:\automated-testing\scripts\platform\validate-contracts.ts`
- Modify later: `E:\automated-testing\skills\dev-test-handoff\references\confidence-and-ids.md`
- Modify later: `E:\automated-testing\skills\test-execution\references\coverage-and-traceability.md`
- Modify later: `E:\automated-testing\skills\whitebox-test-execution\references\whitebox-contract.md`
- Modify later: `E:\automated-testing\test-cases\README.md`
- Modify later: `E:\automated-testing\AGENTS.md` only after compatibility review

**Interfaces:**
- `ContractExecutionResult` exposes `TestCaseId`, `ExecutionStatus`, `ApplicabilityStatus`, `CoverageStatus`, `ExpectedBasis`, `EvidenceIds`, `ObservationEvidenceIds`, `EnvironmentId`, `AcceptanceExpectation`, `attempts`, `GateStatus`, and optional baseline/alignment fields.
- `ObservationEvidence` records Runtime Observation as Actual evidence with `EvidenceId`, `ObservationType`, `ObservedAt`, `Source`, and sanitized observation payload; it is never used as an ExpectedBasis value.
- `ContractValidator.validateTestCase(input): ValidationIssue[]` validates new records without rewriting historical Markdown.
- `ContractValidator.validateExecutionResult(input): ValidationIssue[]` rejects invalid status combinations described above.
- `LegacyFieldAdapter` maps `Module` → `ModuleId`, `RequirementSource` → `RequirementEvidence`, and `ExecutionStatus`/`Status` aliases into the canonical result without changing source files.
- `LegacyFieldAdapter` maps legacy coverage fields explicitly: legacy `PASS`/`COVERED` → `ExecutionStatus=PASS` plus `CoverageStatus=COVERED`; legacy `PARTIAL`/`LIMITED` → `GateStatus=LIMITED` plus `CoverageStatus=PARTIAL`; legacy `NOT_APPLICABLE` → `ApplicabilityStatus=NOT_APPLICABLE` plus `CoverageStatus=NOT_APPLICABLE` and requires a generated compatibility reason; legacy `MANUAL` → `ExecutionStatus=MANUAL` plus `CoverageStatus=MANUAL`; legacy `UNTESTED` → `ExecutionStatus=SKIPPED` plus `CoverageStatus=UNTESTED`; legacy `FAIL`/`ERROR`/`BLOCKED` remain execution outcomes and do not get converted to PASS by coverage mapping.

- [ ] **Step 1: Add failing contract fixtures** covering `NOT_APPLICABLE`, `BASELINE_LIMITED`, missing `ApplicabilityReason`, and `MISMATCH`.
- [ ] **Step 2: Run the validator test and confirm the invalid fixtures fail.**
- [ ] **Step 3: Add TypeScript contract types and JSON Schemas.** Keep execution statuses separate from applicability and coverage statuses.
- [ ] **Step 4: Implement the validator and legacy field adapter.** The adapter must read existing records and never rewrite them.
- [ ] **Step 5: Run contract validation against new fixtures and representative existing TestCases.** Expected result: new invalid fixtures are rejected; old records are reported as compatibility warnings, not deleted; old coverage values produce the explicit Execution/Coverage mapping above.
- [ ] **Step 6: Commit only PLATFORM-01 files after `git diff --check` and UTF-8 validation pass.** Do not stage existing unrelated dirty files.

**Acceptance:** Contract combinations are machine-validatable; existing TestCase IDs remain unchanged; the six execution statuses remain authoritative; `ApplicabilityStatus` and `BASELINE_LIMITED` are represented without ambiguity.

### PLATFORM-02: Synthetic Product Runtime

**Files:**
- Create: `E:\automated-testing\fixtures\synthetic-product\backend\server.ts`
- Create: `E:\automated-testing\fixtures\synthetic-product\backend\routes.ts`
- Create: `E:\automated-testing\fixtures\synthetic-product\backend\state.ts`
- Create: `E:\automated-testing\fixtures\synthetic-product\frontend\index.html`
- Create: `E:\automated-testing\fixtures\synthetic-product\frontend\app.ts`
- Create: `E:\automated-testing\fixtures\synthetic-product\data\seed.json`
- Create: `E:\automated-testing\fixtures\synthetic-product\data\acceptance-expectations.json`
- Create: `E:\automated-testing\fixtures\synthetic-product\README.md`
- Create: `E:\automated-testing\scripts\platform\synthetic-runtime.ts`
- Create: `E:\automated-testing\contracts\schemas\synthetic-runtime.schema.json`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-ENV-001.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-AUTH-001.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-CRUD-001.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-VALIDATION-001.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-PERMISSION-001.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-STATE-001.md`

**Interfaces:**
- `startSyntheticRuntime({host:'127.0.0.1', port:0}): Promise<RuntimeHandle>`.
- `RuntimeHandle` contains `pid`, `baseUrl`, `apiBaseUrl`, `close(): Promise<void>`, and `ownedProcess: true`.
- The runtime must expose deterministic seed/reset behavior and never read `config/local-projects.json`.
- Each seeded scenario contains exactly one `AcceptanceExpectation`: `EXPECT_PASS`, `EXPECT_PRODUCT_FAIL`, `EXPECT_BLOCKED`, `EXPECT_MANUAL`, or `EXPECT_BASELINE_LIMITED`.
- The backend must implement login, CRUD, validation, permission, state transition, feature flag, known bug, server error, and manual-only boundary endpoints/pages.

- [ ] **Step 1: Write a runtime lifecycle test asserting dynamic port, owned PID, health response, and clean close.**
- [ ] **Step 2: Run it and confirm no runtime implementation exists.**
- [ ] **Step 3: Implement the in-memory backend and static frontend with test-owned seed data.**
- [ ] **Step 4: Implement `RuntimeHandle` and PID ownership checks; close only the process started by the current run.**
- [ ] **Step 5: Seed one known product defect whose actual result is `ExecutionStatus=FAIL` and `AcceptanceExpectation=EXPECT_PRODUCT_FAIL`; keep the defect evidence and do not rewrite it to PASS.**
- [ ] **Step 6: Run lifecycle, CRUD, validation, auth, permission, state, error, manual-boundary, and expectation-aware tests against the dynamic URL.**
- [ ] **Step 7: Commit only Synthetic Product and its TestCases after verifying no real business URL, credential, DLL, or source path is referenced.**

**Acceptance:** Synthetic Product starts on an ephemeral localhost port, reports its own PID, supports controlled reset, and can be fully tested without any existing real business localhost. The known defect remains an actual product `FAIL`; the platform acceptance passes only because `EXPECT_PRODUCT_FAIL` confirms that the defect was correctly discovered and classified.

### PLATFORM-03: Skill-to-Skill Acceptance

**Files:**
- Create: `E:\automated-testing\tests\acceptance\contract\contract-acceptance.spec.ts`
- Create: `E:\automated-testing\tests\acceptance\contract\contract-acceptance-runtime.ts`
- Create: `E:\automated-testing\tests\acceptance\agent\dev-to-test.spec.ts`
- Create: `E:\automated-testing\tests\acceptance\agent\source-to-whitebox.spec.ts`
- Create: `E:\automated-testing\tests\acceptance\agent\agent-acceptance-runtime.ts`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-SKILL-001.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-SKILL-002.md`
- Create: `E:\automated-testing\reports\synthetic-skill-acceptance.md`

**Interfaces:**
- `HandoffArtifact` must identify source baseline, ExpectedBasis, scope, and sanitized output path.
- `WhiteboxBaselineArtifact` must identify `BaselineStatus`, source hash, runtime hash if applicable, and `SourceRuntimeAlignment`.
- `CONTRACT_ACCEPTANCE` consumes synthetic artifacts and canonical validators directly; it is deterministic and CI-eligible.
- `AGENT_ACCEPTANCE` actually invokes the relevant Skill entrypoint (`dev-test-handoff`, `test-execution`, or `whitebox-test-execution`) as a controlled local subprocess, then verifies produced artifacts and result semantics.
- `AGENT_ACCEPTANCE` is Local/Controlled Acceptance in the first implementation and is not part of hosted CI until process invocation, timeout, evidence sanitization, and deterministic output are separately proven.
- Existing Skill `self_test.py` and `validate_contract.py` are component checks only; running them alone must never be reported as complete Agent Skill-to-Skill Acceptance.

- [ ] **Step 1: Create failing `CONTRACT_ACCEPTANCE` assertions for Handoff read-only consumption, White-box Baseline gate behavior, ExpectedBasis, ApplicabilityStatus, and AcceptanceExpectation.**
- [ ] **Step 2: Run `CONTRACT_ACCEPTANCE` and confirm invalid combinations fail while valid `EXPECT_PRODUCT_FAIL` is recognized as an acceptance success with actual `ExecutionStatus=FAIL`.**
- [ ] **Step 3: Implement the smallest contract acceptance adapter around the existing three Skill contracts; do not rewrite each Skill wholesale.**
- [ ] **Step 4: Create failing `AGENT_ACCEPTANCE` assertions that require actual Skill subprocess invocation and artifact provenance, not just self-test output.**
- [ ] **Step 5: Implement controlled Skill invocation with explicit executable path, timeout, owned process tracking, sanitized temporary workspace, and captured exit/result evidence.**
- [ ] **Step 6: Verify `HANDOFF_BASELINE`, `APPROVED_BASELINE`, `DESIGN`, `REQUIREMENT`, `CODE_BEHAVIOR`, and `UNKNOWN` remain distinguishable in results; Runtime Observation must be stored only in Actual/Observation Evidence.**
- [ ] **Step 7: Add cases for `BASELINE_VALIDATED`, `BASELINE_LIMITED`, `BASELINE_INCOMPLETE`, `NOT_APPLICABLE`, and `CONDITIONAL`, then run both acceptance classes locally.**

**Acceptance:** `CONTRACT_ACCEPTANCE` is deterministic and CI-eligible. `AGENT_ACCEPTANCE` proves actual Skill invocation locally. Neither path uses real source, DLL, production data, or the existing business localhost; incomplete and limited baselines are not reported as full regression PASS.

### PLATFORM-04: Playwright API Harness

**Files:**
- Create: `E:\automated-testing\tests\api\synthetic\api-fixtures.ts`
- Create: `E:\automated-testing\tests\api\synthetic\TC_SYN_API_CRUD_001.spec.ts`
- Create: `E:\automated-testing\tests\api\synthetic\TC_SYN_API_AUTH_001.spec.ts`
- Create: `E:\automated-testing\tests\api\synthetic\TC_SYN_API_ERRORS_001.spec.ts`
- Create: `E:\automated-testing\tests\api\synthetic\TC_SYN_API_BOUNDARY_001.spec.ts`
- Modify: `E:\automated-testing\tests\api\README.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-API-CRUD-001.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-API-AUTH-001.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-API-ERRORS-001.md`
- Create: `E:\automated-testing\test-cases\synthetic\TC-SYN-API-BOUNDARY-001.md`

**Interfaces:**
- Tests use Playwright `request.newContext()` or the configured `APIRequestContext`; no Postman/Newman/RestAssured.
- Every request fixture receives `apiBaseUrl` from `RuntimeHandle`, never from the real local-project profile.
- API evidence is sanitized before writing to `artifacts/api/`.

- [ ] **Step 1: Add TestCases and failing API assertions for status/error/data consistency.**
- [ ] **Step 2: Run the focused API command and confirm the reserved API area has no executable harness.**
- [ ] **Step 3: Implement API fixtures using the Synthetic Product runtime and Playwright `APIRequestContext`.**
- [ ] **Step 4: Add CRUD, `400/401/403/404/409/500`, boundary, auth, and response consistency assertions.**
- [ ] **Step 5: Verify request/response evidence redaction and TestCaseId propagation.**
- [ ] **Step 6: Run the focused API suite and commit only API harness files.**

**Acceptance:** All API scenarios execute against the test-owned dynamic runtime and produce sanitized machine-readable results.

### PLATFORM-05: TypeScript Quality Gates and Unified Commands

**Files:**
- Create: `E:\automated-testing\tsconfig.platform.json`
- Create: `E:\automated-testing\eslint.config.mjs`
- Create: `E:\automated-testing\scripts\platform\lint-config.ts`
- Modify: `E:\automated-testing\package.json`
- Modify: `E:\automated-testing\README.md` only in the documentation phase

**Interfaces:**
- `tsconfig.platform.json` initially includes new platform contracts, runtime, adapters, API fixtures, and platform scripts; it does not force unrelated historical POCs into the first gate.
- `npm run typecheck` uses `tsc --noEmit -p tsconfig.platform.json`.
- `npm run lint` uses the repository-local ESLint configuration and excludes generated artifacts, `node_modules`, browser binaries, and ignored local runtime configuration.

- [ ] **Step 1: Add a deliberately failing typecheck fixture for an invalid contract status combination.**
- [ ] **Step 2: Add the minimal strict platform TypeScript configuration and ESLint rules.**
- [ ] **Step 3: Add scripts `test:web`, `test:api`, `test:skills`, `test:synthetic`, `validate`, `typecheck`, `lint`, and `test:ci`; make `test:ci` consume only commands that already pass locally.**
- [ ] **Step 4: Run each command on its smallest focused scope and fix only platform-owned errors.**
- [ ] **Step 5: Run `npm run typecheck`, `npm run lint`, and `npm run validate` together.**

**Acceptance:** New platform code has repeatable type and lint gates without requiring a large dependency installation or broad historical refactor.

### PLATFORM-06: CI-safe GitHub Actions

**Files:**
- Create: `E:\automated-testing\.github\workflows\test-platform.yml`
- Modify: `E:\automated-testing\package.json`
- Modify: `E:\automated-testing\.gitignore`
- Create: `E:\automated-testing\scripts\platform\ci-safety-check.ts`

**Interfaces:**
- The workflow consumes the already-verified local commands from PLATFORM-05; it must not duplicate test logic or introduce a second command vocabulary.
- `npm run test:ci` runs contract validation, Skill component checks, deterministic `CONTRACT_ACCEPTANCE`, Synthetic Product Web/API tests, typecheck, lint, and aggregation. It does not run Local/Controlled `AGENT_ACCEPTANCE` until that acceptance is explicitly promoted by a separate gate.
- CI environment uses `EnvironmentId=synthetic-ci` and must fail if a real product path, real business localhost, or secret-looking value is referenced.

- [ ] **Step 1: Add a CI safety test that scans workflow and Synthetic commands for forbidden real-runtime references.**
- [ ] **Step 2: Run the safety test and confirm the workflow does not yet exist.**
- [ ] **Step 3: Add the workflow with `npm ci`, Playwright browser setup, and the exact locally verified commands from PLATFORM-05.**
- [ ] **Step 4: Keep Avalonia/Appium/FlaUI and Local/Controlled `AGENT_ACCEPTANCE` out of the hosted CI workflow.**
- [ ] **Step 5: Validate workflow YAML, run `npm run test:ci` locally in the Synthetic profile, and confirm no real processes are started.**

**Acceptance:** CI is deterministic, test-repository-only, consumes existing passing local commands, and produces artifacts even when a test fails without leaking secrets or real environment paths.

### PLATFORM-07: Environment Profiles and Result Aggregation

**Files:**
- Create: `E:\automated-testing\config\environments.example.json`
- Create: `E:\automated-testing\contracts\schemas\environment-profile.schema.json`
- Create: `E:\automated-testing\scripts\platform\load-environment.ts`
- Create: `E:\automated-testing\scripts\platform\aggregate-results.ts`
- Create: `E:\automated-testing\scripts\platform\flaky-policy.ts`
- Create: `E:\automated-testing\reports\README.md`
- Modify later: `E:\automated-testing\config\README.md`

**Interfaces:**
- `loadEnvironment('synthetic-ci'): EnvironmentProfile` returns dynamic URL placeholders and rejects real business URLs in CI.
- `aggregateResults(inputs): AggregatedReport` returns status counts, applicability counts, coverage counts, gate summaries, defect summaries, evidence completeness, and flaky attempt details.
- `classifyFlaky(attempts): FlakyClassification` preserves final status and first-failure evidence; retry cannot transform a product FAIL into a clean PASS without an explicit retry classification.

- [ ] **Step 1: Add failing profile and aggregation fixtures covering synthetic, real-project, missing capability, and secret rejection.**
- [ ] **Step 2: Implement the environment schema and loader with `EnvironmentId`, `Runtime`, `WebBaseUrl`, `ApiBaseUrl`, `DesktopRuntime`, `Capability`, `DestructiveAllowed`, `DataPolicy`, and `EvidencePolicy`.**
- [ ] **Step 3: Implement aggregation from JSON/JUnit/evidence inputs into an ignored machine result and a concise Markdown summary.**
- [ ] **Step 4: Implement retry/flaky classification without changing the final execution status contract.**
- [ ] **Step 5: Run aggregation fixtures and confirm `BASELINE_LIMITED`, `NOT_APPLICABLE`, and `CONDITIONAL` are visible in the output.**

**Acceptance:** Synthetic and future real-project environments are explicitly separated; reports answer status, coverage, applicability, gate, defect, evidence, and flaky questions from one aggregation output.

### PLATFORM-08: Governance, Skill Alignment, and Final Verification

**Files:**
- Modify: `E:\automated-testing\skills\dev-test-handoff\SKILL.md` and relevant references/templates
- Modify: `E:\automated-testing\skills\test-execution\SKILL.md` and relevant references/templates
- Modify: `E:\automated-testing\skills\whitebox-test-execution\SKILL.md` and relevant references/templates
- Modify: `E:\automated-testing\test-cases\README.md`
- Modify: `E:\automated-testing\README.md`
- Modify: `E:\automated-testing\config\README.md`
- Create: `E:\automated-testing\reports\agent-driven-platform-acceptance.md`

**Interfaces:**
- Each Skill references the canonical contracts but retains its own responsibility boundary.
- `dev-test-handoff` stops after sanitized Handoff and does not create formal test execution results.
- `test-execution` consumes Handoff and treats Handoff Expected as read-only.
- `whitebox-test-execution` requires source-readable baseline gates, ExpectedBasis, alignment status, and non-invasive coverage rules.

- [ ] **Step 1: Add failing documentation/self-test checks for missing canonical contract references and forbidden boundary crossings.**
- [ ] **Step 2: Update the three Skill references and templates to use the canonical field names while retaining backward-compatible aliases.**
- [ ] **Step 3: Update README sections to distinguish `Implemented`, `In Progress`, and `Planned`; replace new real machine paths with `<source_root>` and `<runtime_root>` placeholders where safe.**
- [ ] **Step 4: Run every Skill self-test and validator, platform validation, Synthetic Web/API acceptance, typecheck, lint, and aggregation.**
- [ ] **Step 5: Run `git diff --check`, UTF-8 validation, forbidden-artifact scan, source-tree safety checks, and focused Web regression.**
- [ ] **Step 6: Write the final platform acceptance report with actual commands, statuses, evidence paths, limitations, and unchanged real-source hashes.**

**Acceptance:** Three Skills share one contract vocabulary without becoming one Skill; the full Synthetic pipeline is green; real product paths remain untouched; any incomplete capability is reported as `BLOCKED`, `MANUAL`, `SKIPPED`, or `BASELINE_LIMITED` with evidence rather than fabricated PASS.

## Verification Matrix

| Stage | Minimum verification | Forbidden dependency |
|---|---|---|
| PLATFORM-01 | Contract fixtures, schema validator, compatibility warnings | Real product runtime |
| PLATFORM-02 | Dynamic port, owned PID, health/reset/close | Existing business localhost |
| PLATFORM-03 | CI-eligible `CONTRACT_ACCEPTANCE` plus Local/Controlled actual `AGENT_ACCEPTANCE` | Real source, DLL, production data |
| PLATFORM-04 | Playwright API CRUD/error/boundary suite | Postman/Newman/RestAssured |
| PLATFORM-05 | Typecheck, lint, unified local commands | Broad historical rewrite |
| PLATFORM-06 | Workflow safety scan consuming PLATFORM-05 commands | Real field systems |
| PLATFORM-07 | Profile/schema/aggregation/flaky fixtures | Secret or private runtime config |
| PLATFORM-08 | Skill self-tests, regression, safety/hash/diff checks | Product code modification |

## Rollback and Change Isolation

- Each PLATFORM stage is committed separately only after its own focused verification passes.
- Existing dirty files are never staged by path globs; staging uses an explicit allowlist.
- If a canonical contract conflicts with a historical report, preserve the historical report and add a compatibility adapter or migration note.
- If Synthetic Product or CI introduces a dependency on a real environment, stop that stage and revert only the stage-owned files.
- No push, branch merge, history rewrite, or destructive cleanup is part of this plan.

## Plan Self-Review

- Spec coverage: all PLATFORM-01 through PLATFORM-08 stages are mapped to tasks; `ApplicabilityStatus`, `BASELINE_LIMITED`, dynamic PID-owned localhost, the six-value ExpectedBasis (`REQUIREMENT`, `DESIGN`, `APPROVED_BASELINE`, `HANDOFF_BASELINE`, `CODE_BEHAVIOR`, `UNKNOWN`), Actual/Observation Evidence, Baseline Gate, Source/Runtime Alignment, state compatibility, non-invasive coverage, API Harness, TypeScript-before-CI ordering, profiles, aggregation, flaky policy, Playwright stability, and README governance are covered.
- Acceptance semantics: deterministic `CONTRACT_ACCEPTANCE` is explicitly CI-eligible; actual `AGENT_ACCEPTANCE` invokes Skills and remains Local/Controlled until separately promoted. Skill self-tests and validators are component checks, not full Agent Acceptance.
- Expected defect semantics: Synthetic Product scenarios carry `AcceptanceExpectation`; `EXPECT_PRODUCT_FAIL` requires actual `ExecutionStatus=FAIL`, while the acceptance harness may pass only the meta-assertion that the expected defect was discovered and classified. No product FAIL is rewritten to PASS.
- Legacy compatibility: `LegacyFieldAdapter` has explicit old Coverage → new Execution/Coverage mappings, and `GateStatus` is constrained to `PASS|LIMITED|FAIL`; mappings preserve old failure outcomes.
- Compatibility: old TestCase IDs, Markdown reports, Web evidence helper, and three Skill boundaries are preserved through adapters and staged updates.
- Safety: no task modifies real product source, starts an unmanaged process, or permits Synthetic tests to use the existing real business localhost.
- No implementation is executed by this plan file; execution requires a separate explicit approval/selection of an execution mode.
- Architecture review: no new conflict found. `ApplicabilityStatus` answers whether a scenario applies, `CoverageStatus` answers coverage, `ExecutionStatus` answers the actual run, `GateStatus` answers gate quality, and `AcceptanceExpectation` answers what the Synthetic scenario is supposed to demonstrate; these dimensions are intentionally not collapsed.
