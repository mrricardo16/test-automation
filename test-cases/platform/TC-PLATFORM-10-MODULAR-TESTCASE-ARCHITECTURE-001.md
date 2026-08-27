# TC-PLATFORM-10-MODULAR-TESTCASE-ARCHITECTURE-001

- TestCaseId: `TC-PLATFORM-10-MODULAR-TESTCASE-ARCHITECTURE-001`
- TestType: Contract / Reporting Governance
- TestLayer: Platform
- Objective: 验证 TestCase Catalog 使用 Module → Feature → Operation → ScenarioGroup → TestCase 的主信息架构。
- PrimaryAssertion: ExecutionStatus、AutomationEligibility、ActivationStatus、CoverageStatus 不改变同一 Module/Feature/Operation 下 TestCase 的连续排序。
- ExpectedResult: 模块化分类字段、受控 Operation/ScenarioGroup、PresentationOrder 和 Catalog 连续性均通过校验。
- ExpectedBasis: `DESIGN`
- Preconditions: V2 TestCase schema、validator 和项目 Catalog adapter 可读取。
- Steps:
  1. 构造包含不同执行状态的同一统计查询场景。
  2. 按 PresentationOrder 生成 MODULE-oriented Catalog。
  3. 校验统计查询三条 Case 相邻，并拒绝状态作为主分组。
- CoverageTags: `VALIDATION`, `DATA_CONSISTENCY`, `COMPOSITE_FLOW`
- ExecutionStatus: `SKIPPED`（本记录用于本轮契约验证设计，未执行真实业务）
