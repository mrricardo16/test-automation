# TC-PLATFORM-14-BLACKBOX-STANDARD-REBUILD-001

| Field | Value |
|---|---|
| TestCaseId | TC-PLATFORM-14-BLACKBOX-STANDARD-REBUILD-001 |
| CaseKind | COMPOSITE |
| ModuleId | PLATFORM |
| FeatureId | BLACKBOX-TESTCASE-GENERATION-STANDARD-REBUILD |
| Title | 校验黑盒测试用例生成标准重建及八类机器产物 |
| Priority | P0 |
| TestType | Contract / Governance |
| TestLayer | CONTRACT |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | REQUIREMENT |
| ExpectedResult | 历史 22 条用例及其 Expected、执行状态保持不变；33 条缺口候选生成非空 ExpectedResult 的 EXPECTED_PENDING_AUTHORITY 用例；八类机器产物通过 authority completeness、双向追踪和质量校验。 |
| Objective | 在不读取产品源码、Runtime、DLL、PDB、数据库当前行为且不改 Frozen Handoff 的条件下，验证黑盒测试用例生成标准与机器产物。 |
| PrimaryAssertion | 生成器输出恰好八类机器产物，所有 55 个场景均有唯一 TestCase 和非空 ExpectedResult，且权威状态、缺口分类与双向追踪一致。 |
| AutomationType | AUTO |
| AutomationEligibility | AUTO_ALLOWED |
| AutomationFramework | Node.js test runner |
| LifecycleStatus | ACTIVE |
| ReviewGateStatus | PASS |
| RiskLevel | RISK_LOW |
| SideEffects | TEST_DATA_CREATE |
| SideEffectScope | PROJECT_SANDBOX |
| Reversibility | CLEANUP_REVERSIBLE |
| DataOwnership | PROJECT_SANDBOX |
| InteractionMode | UNATTENDED |

## Preconditions

- 仅使用 `E:\automated-testing` 内已存在的 22 条细粒度设计用例和 33 条规则待确认候选。
- 不读取或执行产品源码、Runtime、DLL、PDB、数据库或业务测试。
- Frozen Handoff 和历史 run 只作为不可变边界，不由本测试写入。

## Steps

1. 构建 Module、Feature、Operation、BusinessRule inventory。
2. 对全部场景执行设计技术、Expected 权威、缺口分类、风险与后置条件评估。
3. 生成八类 JSON 机器产物并执行结构、数量、历史不变、authority completeness 和双向追踪校验。
4. 校验输出目录只包含声明的八个机器产物。

## PostConditions

- 仅项目自有输出目录包含可重复生成的 JSON 产物。
- 历史 22 条源用例、历史报告、Frozen Handoff 与产品边界均无变化。

## Cleanup

删除测试使用的临时输出目录；持久化八类产物由正式生成步骤覆盖更新。

## CleanupVerification

临时目录不存在，正式输出目录恰好包含生成清单声明的八个文件。
