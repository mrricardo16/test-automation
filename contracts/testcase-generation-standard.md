# TestCase Generation Standard V2

本文件是 TestCase 生成的统一主干标准，适用于 Black-box、White-box、Web、API、Desktop 和 Manual。执行技能只引用本标准，不复制或改写其规则。Expected 的来源和访问权限仍由各执行技能自己的边界决定。

## 三层模型

1. `ScenarioSuite`：聚合业务生命周期、风险、设计模型、TestCase 和 ExpectationGap。它不是执行单位，不包含 `ExecutionStatus`。
2. `TestCase`：可独立执行、独立判定、独立取证和独立报告的最小正式单位，`CaseKind` 为 `ATOMIC` 或 `COMPOSITE`。
3. `ExpectationGap`：记录权威来源未定义的 Expected。它阻止相关候选进入 AUTO，且 Runtime Observation 不得用于补写 Expected。

## 生成流程

1. 分析需求、设计或批准基线，识别对象、规则、角色、状态、关系和副作用。
2. 评估风险、数据归属、可逆性、清理能力和人工交互。
3. 按需建立等价类、边界值、决策表、状态模型、权限矩阵、CRUD 生命周期矩阵、关系完整性模型和会话模型。
4. 生成覆盖候选；缺少权威 Expected 的候选先生成 `ExpectationGap`。
5. 将可独立执行、判定和取证的目标拆成独立 TestCaseId；等价数据优先参数化。
6. 仅当跨步骤状态本身是主要业务目标时生成 `COMPOSITE`。
7. 聚合 `ScenarioSuite` 并执行 Review Gate。

## Atomic 与 Composite

`ATOMIC` 只允许一个 `Objective` 和一个 `PrimaryAssertion`。查询、输入校验、权限、状态、错误分支若可独立执行、判定和取证，必须分别生成 TestCaseId。支持主要断言的观察或不变量不机械拆分。

`COMPOSITE` 只允许一个主要业务目标，字段和约束见 [Composite TestCase Standard](composite-testcase-standard.md)。Create→Read、Delete→Read、Delete→Recreate、Delete→Update、Delete→Delete、Disable→Update、权限变化后的刷新/重新登录，以及父子引用完整性是典型候选，但只有 Expected 已由权威来源定义时才能成为可执行 TestCase。

## Test design models

`DesignModels` 可使用：`EQUIVALENCE_PARTITIONING`、`BOUNDARY_VALUE`、`DECISION_TABLE`、`STATE_MODEL`、`PERMISSION_MATRIX`、`CRUD_LIFECYCLE_MATRIX`、`RELATION_INTEGRITY_MODEL`、`SESSION_MODEL` 和 `ERROR_MODEL`。模型用于证明覆盖来源，不替代 Expected、步骤或断言。

## ExpectationGap protection

- Runtime Observation 永远只进入 Actual/Observation Evidence。
- `ExpectedBasis=UNKNOWN` 的 V2 候选必须链接 `ExpectationGapRefs`，使用 `AutomationEligibility=NOT_EXECUTABLE`，并且 Review Gate 不得 PASS。
- 解决 Gap 时必须记录批准来源和决议；不得将“当前运行时如此”作为 Expected 来源。
- 未解决 Gap 不得生成 PASS/FAIL，也不得进入 AUTO 或人工执行队列。

## Unattended automation routing

`AUTO_ALLOWED` 必须同时满足：`LifecycleStatus=ACTIVE`、`ReviewGateStatus=PASS`、风险和副作用已知、操作可逆或无需清理、数据为隔离自有或明确批准、安全清理可验证、无人工交互、无未解决 ExpectationGap。

- `AUTO_ALLOWED`：无人值守执行；Runner 不等待确认、验证码、选择文件、人工观察或 MANUAL 队列。
- `MANUAL_REQUIRED`：人工交互、共享/未知数据、高风险、不可逆或无法可靠自动判定。
- `NOT_EXECUTABLE`：前置条件、环境或安全数据缺失，或 Expected 未获批准；此时必须关联 `ExpectationGapRefs`，不得进入执行队列。

V2 不使用 `AUTO_PARTIAL` 表示“自动执行中暂停等人”。历史 `AUTO_PARTIAL` 保持可读，但新用例必须拆成独立 AUTO 与 MANUAL TestCase，并由 `ScenarioSuite` 聚合。

## Review Gate 与兼容性

Review Gate 至少检查：唯一 TestCaseId、单一 Objective、单一 PrimaryAssertion、ExpectedBasis、Expected、设计模型覆盖、初始状态、风险、数据归属、交互模式、可逆性、清理与验证、证据要求和执行层。含多个独立目标的 Mega Case 必须拆分。新 Case 的 `AutomationEligibility`、`SideEffects`、`SideEffectScope`、`Reversibility` 和 `RiskLevel` 必须使用本标准受控值。

历史 TestCase 不要求补写 `CaseKind` 或 V2 字段，也不批量改写。新建或实质重设计的 TestCase 必须声明 `CaseKind` 并满足 V2 条件字段。`LegacyFieldAdapter` 继续负责旧字段读取，不得用兼容逻辑绕过 V2 Review Gate。
