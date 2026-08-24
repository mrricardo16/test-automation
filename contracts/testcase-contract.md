# TestCase Contract

Canonical TestCase 采用历史兼容分支和 V2 分支。历史记录保持原样可读；新建或实质重设计的记录必须遵循 [TestCase Generation Standard V2](testcase-generation-standard.md)。

历史 Canonical TestCase 至少包含：

```text
TestCaseId
ModuleId
FeatureId
Title
Priority
TestType
TestLayer
ApplicabilityStatus
ExpectedBasis
ExpectedResult
AutomationType
AutomationFramework
```

V2 在上述字段上新增：

```text
CaseKind                  ATOMIC | COMPOSITE
ScenarioSuiteId           场景套件标识
Objective                 单一主要目标
PrimaryAssertion          单一主要判定
SupportingAssertions      支持性断言
IntermediateAssertions    中间断言
ExpectedPerStep           每步预期和状态
PostConditions            产品后置条件
StateTransitions          状态迁移
CrossStepInvariants       跨步骤不变量
LifecycleStatus           DRAFT | ACTIVE | RETIRED
ReviewGateStatus          PASS | LIMITED | FAIL
RiskLevel                 RISK_LOW | RISK_MEDIUM | RISK_HIGH | RISK_CRITICAL
SideEffects               NONE | TEST_DATA_CREATE | TEST_DATA_UPDATE | TEST_DATA_DELETE | AUTH_CHANGE | SESSION_CHANGE | GLOBAL_CONFIG_CHANGE | EXTERNAL_EFFECT
SideEffectScope           TEST_OWNED | PROJECT_SANDBOX | SHARED_ENVIRONMENT | UNKNOWN
Reversibility             REVERSIBLE | CLEANUP_REVERSIBLE | IRREVERSIBLE | UNKNOWN
DataOwnership             TEST_OWNED | PROJECT_SANDBOX | SHARED_ENVIRONMENT | UNKNOWN
InteractionMode           UNATTENDED | INTERACTIVE
AutomationEligibility     AUTO_ALLOWED | MANUAL_REQUIRED | NOT_EXECUTABLE
ExpectationGapRefs        预期缺口标识数组
```

`COMPOSITE` 还必须包含 `InitialState`、`Preconditions`、`TestData`、`Steps`、`ExpectedPerStep`、`IntermediateAssertions`、`StateTransitions`、`PostConditions`、`CrossStepInvariants`、`Cleanup` 和 `CleanupVerification`。详见 [Composite TestCase Standard](composite-testcase-standard.md)。

## ExpectedBasis

- `REQUIREMENT`：来自明确需求或验收要求。
- `DESIGN`：来自设计文档或流程设计。
- `APPROVED_BASELINE`：来自已批准的基线。
- `HANDOFF_BASELINE`：来自开发端交接包，测试端只读消费。
- `CODE_BEHAVIOR`：只表示 Characterization 或 Implementation Regression。
- `UNKNOWN`：预期来源无法确认。

Runtime Observation 必须放入 Actual/Observation Evidence，不允许使用 `RUNTIME_OBSERVED` 作为 ExpectedBasis。

`CODE_BEHAVIOR` 不得自动宣称 requirements compliance；需要需求符合性时，必须使用 `REQUIREMENT` 或其他有证据的 ExpectedBasis。

V2 中 `ExpectedBasis=UNKNOWN` 时不得伪造 `ExpectedResult`：必须链接符合 [ExpectationGap Schema](schemas/expectation-gap.schema.json) 的 `ExpectationGapRefs`，并使用 `AutomationEligibility=NOT_EXECUTABLE`。ScenarioSuite 的机器契约见 [ScenarioSuite Schema](schemas/scenario-suite.schema.json)。
