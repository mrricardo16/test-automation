# TestCase Contract

Canonical TestCase 至少包含：

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

## ExpectedBasis

- `REQUIREMENT`：来自明确需求或验收要求。
- `DESIGN`：来自设计文档或流程设计。
- `APPROVED_BASELINE`：来自已批准的基线。
- `HANDOFF_BASELINE`：来自开发端交接包，测试端只读消费。
- `CODE_BEHAVIOR`：只表示 Characterization 或 Implementation Regression。
- `UNKNOWN`：预期来源无法确认。

Runtime Observation 必须放入 Actual/Observation Evidence，不允许使用 `RUNTIME_OBSERVED` 作为 ExpectedBasis。

`CODE_BEHAVIOR` 不得自动宣称 requirements compliance；需要需求符合性时，必须使用 `REQUIREMENT` 或其他有证据的 ExpectedBasis。
