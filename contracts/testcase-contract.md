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

黑盒标准重建生成的每个 Scenario/TestCase 还必须包含：

```text
ScenarioId
BusinessRuleId
ExpectedStatus             EXPECTED_CONFIRMED | EXPECTED_PENDING_AUTHORITY
ExpectedSourceRef          非空权威引用数组；pending 时至少引用 ExpectationGapId
ExpectedAuthority          已批准权威标识 | PENDING_AUTHORITY
ExpectationGapId           pending 时必填
GapClassification          EXPECTED_EXTRACTION_MISS | TRUE_GAP
ExpectedResultSemantics    pending 时固定 AUTHORITY_GAP_DESCRIPTION_NOT_BUSINESS_ORACLE
ExpectedAuthorityCompleteness
BusinessRuleRefs
TraceabilityRefs
DesignTechniques           设计技术数组
RiskModel                  优先级、风险等级和 Expected 权威影响
```

`EXPECTED_PENDING_AUTHORITY` 的 `ExpectedResult` 必须非空，但其语义仅是可判定的缺口描述（说明需要权威确认什么），不是产品应产生的业务结果。该用例必须 `NOT_EXECUTABLE`，不得用于 PASS/FAIL。传统 V2 `ExpectedBasis=UNKNOWN` 且未声明 `ExpectedStatus` 的兼容规则保持不变。

`ExpectedAuthorityCompleteness` 必须记录 `AuthoritySourcesAvailable`、`AuthoritySourcesSearched`、`RelevantSectionsFound`、`BusinessRulesExtracted`、`ExpectedCandidateFound`、`ExpectedSourceRef` 和 `SearchCompleteness`。只有完整检索且未发现 Expected 时，Gap 才能分类为 `TRUE_GAP`；权威资料已有规则却未映射时分类为 `EXPECTED_EXTRACTION_MISSED`，属于 `TESTCASE_GENERATION_DEFECT`。

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
CandidateState             DESIGN_CANDIDATE | ACTIVE | RETIRED
DesignState               REVIEWED | UNREVIEWED
ActivationStatus          NOT_ACTIVATED | AUTO_ACTIVATED | MANUAL_REQUIRED | BLOCKED | NOT_EXECUTABLE
ActivationDecision        AUTO_ACTIVATE | MANUAL_REQUIRED | BLOCKED | NOT_EXECUTABLE
ExecutionQueueDecision    ENQUEUE | MANUAL_QUEUE | BLOCKED | EMPTY
ExpectationGapApplicable  布尔值；表示该候选是否受未解决 Gap 直接影响
RiskReasonBefore/After    风险重分类审计理由
ModuleName                模块显示名称
FeatureName               功能显示名称
Operation                 QUERY | CREATE | UPDATE | DELETE | VALIDATION | STATE_TRANSITION | PERMISSION | RELATIONSHIP | IMPORT | EXPORT | DOWNLOAD | UPLOAD | AUTHENTICATION | SESSION | COMPOSITE_LIFECYCLE | VISUAL | OTHER
ScenarioGroup             HAPPY_PATH | CONDITION | VALIDATION | NEGATIVE | BOUNDARY | EMPTY_STATE | DUPLICATE | PERMISSION | STATE | RELATIONSHIP | POST_CONDITION | ERROR_HANDLING | RECOVERY | IDEMPOTENCY | COMPOSITE_FLOW | MANUAL_BOUNDARY
PresentationOrder         ModuleOrder、FeatureOrder、OperationOrder、ScenarioOrder、CaseOrder；均为正整数
BusinessRules             业务规则数组；ATOMIC 原则上只能有一个
TestDataDesign            字段、类别、关键值、来源、归属、唯一性、一次性和敏感性
SafetyConstraints         安全约束数组，与业务 Preconditions 分开
DesignTechniques          等价类、边界、查询矩阵、状态模型、决策表、权限矩阵等设计技术
DesignMaturity            DRAFT | REVIEWABLE | EXECUTABLE | LIMITED
```

`COMPOSITE` 还必须包含 `InitialState`、`Preconditions`、`TestData`、`Steps`、`ExpectedPerStep`、`IntermediateAssertions`、`StateTransitions`、`PostConditions`、`CrossStepInvariants`、`Cleanup` 和 `CleanupVerification`。详见 [Composite TestCase Standard](composite-testcase-standard.md)。

## 信息架构与状态边界

完整 TestCase 目录固定按 `MODULE → FEATURE → SCENARIO` 组织；`Operation` 和 `ScenarioGroup` 是受控分类字段，`PresentationOrder` 是稳定展示顺序。`ExecutionStatus`、`AutomationEligibility`、`ActivationStatus`、`CoverageStatus` 属于 Case State，不得作为主分组、次分组或排序条件。相同模块、功能和操作的查询/空态/校验/异常用例必须保持连续；复合用例就地归入所属功能，不单独建立 Composite 章节。

TestCase 设计质量由 [TestCase Design Quality Standard](testcase-design-quality-standard.md) 评估。Schema Valid 不能替代粒度、数据、Expected 可判定性、生命周期、状态模型、权限矩阵、关系完整性、清理边界和 Coverage Gap 审计。

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

黑盒标准重建是上述兼容规则的显式扩展：只有同时声明 `ExpectedStatus=EXPECTED_PENDING_AUTHORITY` 和 `ExpectedResultSemantics=AUTHORITY_GAP_DESCRIPTION_NOT_BUSINESS_ORACLE` 时，`ExpectedResult` 才可保存非空的 Gap 描述；它仍不能保存猜测的业务 Expected。
