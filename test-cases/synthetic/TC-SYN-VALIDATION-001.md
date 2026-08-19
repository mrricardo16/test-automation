# TC-SYN-VALIDATION-001

| Field | Value |
|---|---|
| TestCaseId | TC-SYN-VALIDATION-001 |
| ModuleId | MOD-SYNTHETIC-DATA |
| FeatureId | SYNTHETIC_VALIDATION |
| Title | Verify required-field and length-boundary validation |
| Priority | P1 |
| TestType | API |
| TestLayer | BLACK_BOX_API |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | REQUIREMENT |
| ExpectedResult | Missing name and overlong name requests receive sanitized 400 responses and do not mutate data. |
| AutomationType | AUTO |
| AutomationFramework | Playwright APIRequestContext |
