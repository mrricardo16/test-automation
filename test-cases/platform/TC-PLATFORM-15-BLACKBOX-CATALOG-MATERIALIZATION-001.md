# TC-PLATFORM-15-BLACKBOX-CATALOG-MATERIALIZATION-001

| Field | Value |
|---|---|
| TestCaseId | TC-PLATFORM-15-BLACKBOX-CATALOG-MATERIALIZATION-001 |
| CaseKind | COMPOSITE |
| ModuleId | PLATFORM |
| FeatureId | BLACKBOX-FINE-GRAINED-CATALOG-MATERIALIZATION |
| Title | 校验黑盒细粒度正式 Catalog 材料化与最终报告一致性 |
| Priority | P0 |
| TestType | Contract / Governance |
| TestLayer | CONTRACT |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | REQUIREMENT |
| ExpectedResult | 生成源、正式 Catalog 与主报告均包含同一组 72 条细粒度 TestCase；22 条历史用例及正式结果独立保留；43 条确认预期与 29 条 pending 均有有效 Current Effective State，29 条 pending 全部保留 Gap、当前不可执行和尚未执行；新细粒度用例不继承历史 PASS 或 ERROR。 |
| Objective | 在不执行业务测试、不修改 Frozen Handoff、Harness、Runtime、Fixture、数据库或产品源码的条件下，验证正式材料化产物和最终 Markdown 报告。 |
| PrimaryAssertion | source/materialized/report 数量一致、missing 为零、confirmed/pending/gap 为 43/29/29，历史 22 条完整保留且没有旧执行状态迁移到 72 条细粒度用例。 |
| AutomationType | AUTO |
| AutomationEligibility | AUTO_ALLOWED |
| AutomationFramework | Node.js test runner |
| LifecycleStatus | ACTIVE |
| ReviewGateStatus | PASS |
| RiskLevel | RISK_LOW |
| SideEffects | TEST_ASSET_GENERATION |
| SideEffectScope | PROJECT_SANDBOX |
| Reversibility | REGENERATABLE |
| DataOwnership | PROJECT_SANDBOX |
| InteractionMode | UNATTENDED |

## Preconditions

- 72 条生成结果已存在于项目 `outputs/blackbox-testcase-generation-standard-rebuild/黑盒细粒度测试用例.json`。
- 22 条历史用例目录与既有正式执行结果保持只读输入。
- 本校验不访问产品、Runtime、Fixture、数据库、Agent Browser 或 Frozen Handoff 内容。

## Steps

1. 读取生成源、正式细粒度 Catalog、历史追溯、Current Effective State 和内部 reconciliation。
2. 校验数量、唯一 TestCaseId、材料化元数据、Expected/Gap、当前资格和执行状态。
3. 校验历史 22 条身份与正式执行结果独立保留，且新细粒度用例没有 PASS、FAIL 或 ERROR。
4. 解析最终 Markdown 报告，校验主表恰好显示 72 条细粒度用例，历史章节恰好保留 22 条历史用例。

## PostConditions

- 不产生业务运行、业务数据或产品状态变化。
- 只读取正式设计、治理与报告资产。

## Cleanup

无业务清理；材料化与报告文件均为可重复生成的项目设计资产。
