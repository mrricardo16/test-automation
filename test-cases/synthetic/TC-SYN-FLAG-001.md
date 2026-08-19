# TC-SYN-FLAG-001

| Field | Value |
|---|---|
| TestCaseId | TC-SYN-FLAG-001 |
| ModuleId | MOD-SYNTHETIC-FEATURES |
| FeatureId | SYNTHETIC_FEATURE_FLAG |
| Title | Verify deterministic feature-flag exposure and disabled behavior |
| Priority | P1 |
| TestType | API/UI |
| TestLayer | BLACK_BOX_API |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | DESIGN |
| ExpectedResult | The seeded feature flag is disabled and its preview endpoint returns a controlled 403 without changing state. |
| AutomationType | AUTO |
| AutomationFramework | Playwright APIRequestContext |
