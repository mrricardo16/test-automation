# TC-SYN-AUTH-001

| Field | Value |
|---|---|
| TestCaseId | TC-SYN-AUTH-001 |
| ModuleId | MOD-SYNTHETIC-AUTH |
| FeatureId | SYNTHETIC_LOGIN |
| Title | Verify synthetic login and authenticated request behavior |
| Priority | P0 |
| TestType | API |
| TestLayer | BLACK_BOX_API |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | REQUIREMENT |
| ExpectedResult | Valid test-owned user credentials receive a token; missing or invalid credentials receive 401; protected routes require that token. |
| AutomationType | AUTO |
| AutomationFramework | Playwright APIRequestContext |
