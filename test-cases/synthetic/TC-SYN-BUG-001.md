# TC-SYN-BUG-001

| Field | Value |
|---|---|
| TestCaseId | TC-SYN-BUG-001 |
| ModuleId | MOD-SYNTHETIC-DEFECTS |
| FeatureId | SYNTHETIC_KNOWN_BUG |
| Title | Verify the controlled known-bug scenario is available for future EXPECT_PRODUCT_FAIL acceptance |
| Priority | P1 |
| TestType | API |
| TestLayer | BLACK_BOX_API |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | APPROVED_BASELINE |
| ExpectedResult | The runtime exposes a stable known-bug identifier and expected/actual behavior metadata. A future correctness assertion must observe the actual product FAIL; this availability check does not rewrite that failure. |
| AutomationType | AUTO |
| AutomationFramework | Playwright APIRequestContext |
| AcceptanceExpectation | EXPECT_PRODUCT_FAIL |
