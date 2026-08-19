# TC-SYN-STATE-001

| Field | Value |
|---|---|
| TestCaseId | TC-SYN-STATE-001 |
| ModuleId | MOD-SYNTHETIC-DATA |
| FeatureId | SYNTHETIC_STATE_TRANSITION |
| Title | Verify allowed and rejected item state transitions |
| Priority | P1 |
| TestType | API |
| TestLayer | BLACK_BOX_API |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | DESIGN |
| ExpectedResult | Draft can move to submitted; an invalid direct draft-to-approved transition receives 409 and preserves state. |
| AutomationType | AUTO |
| AutomationFramework | Playwright APIRequestContext |
