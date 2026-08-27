# 通用黑盒测试报告模板

本模板只定义报告结构，不绑定任何业务对象。报告实例应从项目 Catalog 动态生成。

## 1. 测试基本信息

| 项目 | 内容 |
| --- | --- |
| 项目名称 | `{ProjectName}` |
| 测试依据 | `{InputReferences}` |
| Catalog | `{ProjectCatalogPath}` |
| 执行范围 | `{ExecutionScope}` |

## 2. 测试结果概览

说明当前正式测试用例、是否执行、状态口径和证据规则。历史执行记录由内部资产单独保存，不进入本报告正文；未执行用例的“实际验证”统一填写 `—`。

## 3. 细粒度正式测试用例

主表固定九列，业务名称由项目输入替换：

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `{Scenario}` | `{TestCaseId}` | `{ConcretePreconditions}` | `{MeaningfulTestData}` | `{ExecutableSteps}` | `{ExpectedResult}` | `{ExecutionState} / {Eligibility}` | `{ActualOrDash}` | `{InlineEvidenceOrDash}` |

每条用例一个主要业务规则；图片证据紧跟该用例放在最右侧“图片示例”列。正式报告中不展示内部 ExpectedBasis、Gap 内部状态和材料化治理字段。

测试数据使用字段标签和紧凑空格分隔。操作步骤使用 `1、2、3` 顺序编号，按步骤长度分组，每行最多 2 条：短步骤可两条同排，中等或较长步骤一条一行；使用单元格换行，不使用 HTML Break Tag。预期结果按语义断言使用 `1、`、`2、`、`3、` 顺序编号，每条断言一行，同样不使用 HTML Break Tag。9 列主表允许超过正文宽度并使用表格自身的局部横向滚动条。

## 4. 异常与无法执行记录

仅记录真实 FAIL、ERROR、BLOCKED、MANUAL 或明确需要开发确认的事项；不能把未执行自动写成产品缺陷。

## 5. 测试结论与证据索引

汇总当前正式用例数量、状态、图片/Trace/日志链接；项目 Catalog 和内部审计 JSON 作为内部资产保存，不在正文展开历史用例。
