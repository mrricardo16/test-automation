# 通用黑盒测试报告模板

本模板定义业务无关的报告结构。项目报告必须从正式 Fine-Grained TestCase Catalog 动态生成，并遵守 `docs/最终测试报告模板.md` 的最终交付契约。

## 1. 测试基本信息

| 项目 | 内容 |
|---|---|
| 项目名称 | `{ProjectName}` |
| 测试依据 | `{InputReferences}` |
| 正式 Catalog | `{ProjectCatalogPath}` |
| 生成器 | `{RendererPath}` |
| 执行范围 | `{ExecutionScope}` |

## 2. 测试结果概览

说明当前正式测试用例数量、Expected 已确认与 pending、是否执行 Formal Run、状态口径、自动化资格和覆盖率分母。历史执行记录由内部资产单独保存，不进入本报告正文；未执行用例的“实际验证”统一填写 `—`。

## 3. 细粒度正式测试用例

主表按模块、功能、操作连续组织，固定九列：

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
|---|---|---|---|---|---|---|---|---|
| `{Scenario}` | `TC-DEMO-CREATE-001` | `{ConcretePreconditions}` | `{MeaningfulTestData}` | `{ExecutableSteps}` | `{ExpectedResult}` | `{ExecutionState} / {Eligibility}` | `{ActualOrDash}` | `{InlineEvidenceOrDash}` |

每条用例一个主要业务规则；图片证据紧跟该用例放在最右侧“图片示例”列。操作步骤最多 2 条同排：短步骤可两条一行，中等或较长步骤一条一行；预期结果一条断言一行。使用单元格换行，不使用 `<br>`，不允许一字一行。9 列主表超出正文宽度时，使用表格自身的局部横向滚动条，禁止页面整体横向滚动。

## 4. Current Effective State

汇总自动执行资格、人工执行资格、当前不可执行和尚未执行数量。该节不替代第 3 节，也不展示历史用例。

## 5. Expectation Gap

仅索引真实业务预期缺口。pending 用例仍必须保留在第 3 节，不能猜测、删除或写成 PASS。

## 6. 异常报告

异常报告独立于完整测试用例报告，只记录真实 `FAIL`、`ERROR`、`BLOCKED`、`MANUAL` 和明确需要开发确认的事项，并保留实际验证、图片、Trace、日志或错误栈链接。

## 7. 测试结论

总结当前 Catalog 规模、真实执行状态、缺陷与风险。图片证据已在对应 TestCase 行提供，不另设“人工复审”正文模块；人工复审属于执行行为。
