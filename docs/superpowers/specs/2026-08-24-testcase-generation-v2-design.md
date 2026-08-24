# TestCase Generation Standard V2 Design

## Goal

建立与具体业务、运行时、账号和真实测试结果无关的主干 TestCase 生成规范，统一原子用例、复合用例、场景套件、覆盖缺口、预期缺口及无人值守自动化分流。

## Scope

- 共享测试设计方法适用于 Web、API、Desktop、Manual、Black-box 和 White-box。
- Black-box 与 White-box 保持各自的 Expected 来源和权限边界；不因共享生成模型而扩大黑盒权限。
- 本次不访问真实产品、不执行真实业务测试、不修改产品代码、不处理真实凭据。
- 历史 TestCase 保持可读，不批量改写；新 TestCase 使用 V2 契约。

## Design

### Three-level model

`ScenarioSuite` 组织生命周期、风险和覆盖聚合，不直接产生执行状态；`TestCase` 是正式执行和报告的最小单位；TestCase 分为 `ATOMIC` 和 `COMPOSITE`。

### Atomic rule

原子用例必须有一个主要测试目标和一个 `PrimaryAssertion`。查询、输入校验、权限、状态和错误分支在能够独立执行、独立判定和独立取证时分别生成 TestCaseId。等价数据优先参数化，不因支持性断言机械拆分。

### Composite rule

复合用例只允许一个主要业务目标，必须显式记录初始状态、每步预期、状态迁移、主要断言、后置条件、跨步骤不变量、清理和清理验证。典型覆盖包括 `CREATE→QUERY`、`DELETE→QUERY`、`DELETE→RECREATE`、`DELETE→UPDATE`、`DELETE→DELETE`、`DISABLE→LOGIN` 和权限变更后的刷新/重新登录。

### Test design models

生成顺序为：需求分析、对象/规则/角色/状态/关系识别、风险分析、等价类、边界值、决策表、状态模型、权限矩阵、CRUD 生命周期矩阵、关系/会话模型，然后生成覆盖候选、过滤预期缺口、生成原子与复合用例、聚合场景套件并执行 Review Gate。

### Expectation protection

运行时观察永远只能进入 Actual/Evidence。需求未定义的复合场景（例如删除后能否复用同名唯一键）记录 `ExpectationGap`，不得根据实际行为反推 Expected。

### Automation boundary

只有生命周期为 ACTIVE、Review Gate 通过、风险和副作用已知、数据归属安全、可逆或有清理策略且无人工交互的用例才能进入 `AUTO_ALLOWED`。未知、共享、不可逆或高风险操作转为 `MANUAL_REQUIRED`；缺少前置条件为 `BLOCKED`；缺少预期为 `EXPECTATION_GAP`。AUTO 队列不得等待人工确认，也不得等待 MANUAL 队列。

## Acceptance

- Contract、Schema、模板、Validator、Synthetic Fixture、Skill 引用和 README 互相一致。
- Validator 能识别缺少复合用例必要字段、破坏性操作缺少清理、Mega Case、交互式 AUTO 和未知风险 AUTO。
- Synthetic 生命周期覆盖原子 CRUD、删除后查询/重建/更新/重复删除、禁用后更新及父子完整性。
- 历史 TestCase 兼容；静态校验和现有平台回归通过。
