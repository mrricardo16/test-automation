# TC-PLATFORM-07-FLAKY-001

- ModuleId: MOD-PLATFORM-FLAKY
- FeatureId: FEAT-RETRY-FLAKY-POLICY
- Title: 保留重试历史并区分 Flaky 与预期产品缺陷
- Priority: P0
- TestType: Platform Contract
- TestLayer: FLAKY_POLICY
- ApplicabilityStatus: APPLICABLE
- ExpectedBasis: DESIGN
- ExpectedResult: FAIL→PASS 保留首次失败 Evidence 并标记 FLAKY_PASS；单次 EXPECT_PRODUCT_FAIL 不被误判为 Flaky。
- AutomationType: AUTO
- AutomationFramework: Playwright Test
