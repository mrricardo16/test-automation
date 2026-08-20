# TC-PLATFORM-07-AGG-001

- ModuleId: MOD-PLATFORM-AGGREGATION
- FeatureId: FEAT-UNIFIED-RESULT-AGGREGATION
- Title: 聚合 canonical execution、coverage、gate 与 evidence 结果
- Priority: P0
- TestType: Platform Contract
- TestLayer: RESULT_AGGREGATION
- ApplicabilityStatus: APPLICABLE
- ExpectedBasis: DESIGN
- ExpectedResult: 预期产品 FAIL 保持可见且不使平台门失败；非预期 FAIL、P0 未覆盖、缺失 Evidence 和不完整 Baseline 会按规则影响 OverallResult。
- AutomationType: AUTO
- AutomationFramework: Playwright Test
