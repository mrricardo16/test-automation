# Composite TestCase Standard

`COMPOSITE` 用于验证一个跨步骤业务状态目标，不是把多个可独立报告的用例拼成 Mega Case。

## Required fields

- `Objective`：唯一主要业务目标。
- `PrimaryAssertion`：唯一主要判定。
- `InitialState`：开始前可验证的对象、关系、角色和状态。
- `Steps` 与 `ExpectedPerStep`：每一步都有同序号 Expected。
- `StateTransitions`：每项包含 `From`、`Action`、`To`。
- `PostConditions`：完成后必须成立的状态。
- `CrossStepInvariants`：跨步骤始终成立的约束。
- `Cleanup` 与 `CleanupVerification`：清理动作和清理后的独立验证。

## Lifecycle rules

- `CREATE→READ`：Read 验证创建后持久状态，不只验证创建响应。
- `DELETE→READ`：Expected 必须定义删除后的查询语义。
- `DELETE→RECREATE`：必须有唯一键复用规则；未定义则生成 ExpectationGap。
- `DELETE→UPDATE`、`DELETE→DELETE`：必须分别定义不存在对象的更新和重复删除语义。
- `DISABLE→UPDATE`：必须定义禁用对象是否可变更以及状态是否保持。
- 父子引用完整性：必须定义创建、删除或禁用父对象时对子对象引用的影响。

每个步骤的 Actual 和 Evidence 分开记录。支持性断言可放在 `ExpectedPerStep`、`IntermediateAssertions` 或 `CrossStepInvariants`；出现第二个独立 Objective 或 PrimaryAssertion 时必须拆分 TestCaseId。

删除、禁用、权限变化和其他有副作用步骤必须使用安全目标，声明副作用等级，提供清理策略并验证清理。未知、共享、高风险、不可逆或人工交互场景不得标记 `AUTO_ALLOWED`。
