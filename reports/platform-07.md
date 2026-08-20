# PLATFORM-07 Environment Profiles、Result Aggregation 与 Flaky Policy 报告

日期：2026-08-20

## 范围与边界

本阶段只实现 PLATFORM-07。未修改 `.github/workflows/test-platform.yml`，未实施 PLATFORM-08、Agent Invocation、Windows self-hosted CI、Real Project CI、自动 retry、sharding 或 multi-browser。

三个现有 Skill 未修改；未访问真实 localhost、真实 DLL、数据库、业务源码或凭据；未读取 `config/local-projects.json`。

## Environment Profile

- 示例文件：[config/environments.example.json](../config/environments.example.json)
- Schema：[contracts/schemas/environment-profile.schema.json](../contracts/schemas/environment-profile.schema.json)
- Loader：[scripts/platform/load-environment.ts](../scripts/platform/load-environment.ts)
- 环境类型：`SYNTHETIC`、`LOCAL_REAL`、`STAGING`、`CI_SYNTHETIC`、`DESKTOP_LOCAL`
- 能力：`WEB`、`API`、`UNIT`、`INTEGRATION`、`DESKTOP_HEADLESS`、`DESKTOP_E2E`、`MANUAL`

`synthetic-ci` 使用 `CI_SYNTHETIC`、`synthetic` Runtime、动态 Web/API 地址、`WEB`/`API` 能力、`DesktopRuntime=false`、`DestructiveAllowed=true`、`TEST_OWNED_ONLY` 和 `SANITIZED`。`real-project.example` 仅包含 `<web_base_url>`、`<api_base_url>`、`<owner>` 等占位符，没有真实路径、URL、用户名、密码、Token、数据库地址或 DLL。

Loader 使用 JSON Schema + 语义安全校验；未知环境明确报错，不会 fallback 到 `config/local-projects.json`。CI Synthetic profile 若出现真实 Runtime、真实 URL、真实路径、DesktopRuntime 或非 test-owned 数据策略会被拒绝。缺少 `DESKTOP_E2E` 的 `synthetic-ci` 返回 `ExecutionStatus=BLOCKED`、`ApplicabilityStatus=CONDITIONAL`、`GateStatus=LIMITED`。

## Aggregator

- 实现：[scripts/platform/aggregate-results.ts](../scripts/platform/aggregate-results.ts)
- Flaky Policy：[scripts/platform/flaky-policy.ts](../scripts/platform/flaky-policy.ts)
- JSON Source of Truth：`artifacts/platform/<RunId>/platform-summary.json`
- Markdown Render：`reports/generated/platform-summary.md`（运行产物，已忽略）

Aggregator 只读取并派生汇总，不修改原始 Execution Result、TestCase、Evidence 或 Coverage。汇总包含：

- Execution、Applicability、Coverage、Baseline、SourceRuntimeAlignment、Gate；
- AcceptanceExpectation、DefectSummary、EvidenceSummary、FlakySummary；
- `PASS`、`PASS_WITH_LIMITATIONS`、`FAIL`、`BLOCKED` OverallResult；
- P0 未覆盖、Baseline incomplete、Alignment mismatch、Evidence 缺失和环境无效的 Critical Findings。

Known Bug 保持：`ExecutionStatus=FAIL`、`AcceptanceExpectation=EXPECT_PRODUCT_FAIL`、`GateStatus=PASS`。汇总显示 `ProductFailures=1`、`ExpectedProductFailures=1`、`UnexpectedFailures=0`、`AcceptanceGateFailures=0`，不会把产品 FAIL 改成 PASS，也不会因此单独让 OverallResult 失败。

`EXPECT_PASS` 的产品 FAIL 会计为 UnexpectedFailures 并使 OverallResult=FAIL。`BASELINE_LIMITED` 或 Alignment mismatch 最多得到 `PASS_WITH_LIMITATIONS`；`BASELINE_INCOMPLETE` 或 BLOCKED execution 得到 `BLOCKED`；缺失 FAIL/ERROR Evidence 或 P0 `UNTESTED` 得到 `FAIL`。

## Flaky Policy

Canonical 六种 ExecutionStatus 未改变。新增独立 `FlakyClassification`：`NOT_FLAKY`、`FLAKY_PASS`、`FLAKY_FAIL`、`RETRY_NOT_APPLICABLE`、`UNKNOWN`，并保留 `attemptCount`、`attempts`、`firstFailureEvidence`、`retryResult`。

本阶段不自动 retry，也未修改 Playwright 全局 retry。`Attempt 1 FAIL → Attempt 2 PASS` 分类为 `FLAKY_PASS`，保留首次失败 Evidence；单次 `EXPECT_PRODUCT_FAIL` 为 `NOT_FLAKY`，不会被误判为 Flaky。

## TestCase

- `TC-PLATFORM-07-ENV-001`
- `TC-PLATFORM-07-AGG-001`
- `TC-PLATFORM-07-FLAKY-001`

## 验证结果

环境：Node `v24.15.0`、npm `11.12.1`、Python `3.14.4`、Playwright `1.62.1`、Ajv `8.20.0`。

- `npm run typecheck`：PASS
- `npm run lint`：PASS
- `npm run test:profiles`：PASS，4/4
- `npm run test:aggregation`：PASS，8/8
- `npm run validate`：PASS，UTF-8 / schema / executable safety / static validation
- `npm run test:contracts`：PASS，8/8
- `npm run test:skills`：PASS
- `npm run test:web`：PASS，10/10
- `npm run test:api`：PASS，4/4
- `npm run test:synthetic`：PASS，10 + 4 + 12
- `npm run test:platform`：PASS，包含 profiles 4/4、aggregation 8/8
- `npm run test:ci`：本地 Local CI Gate 路径通过；未宣称 GitHub-hosted Runner 已执行
- UTF-8：PASS
- `git diff --check`：提交前执行

开始 PLATFORM-07 前，用户并发提交 `7b45e43 chore: organize test artifacts by project` 已成为 `HEAD` 且与 `origin/main` 同步；未回退该提交。PLATFORM-07 完成后实际远端偏离以最终 `git rev-list --left-right --count origin/main...HEAD` 为准，预期为 `0 1`，不 push。
