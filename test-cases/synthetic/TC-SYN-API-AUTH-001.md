# TC-SYN-API-AUTH-001

| Field | Value |
|---|---|
| ModuleId | MOD-SYNTHETIC-AUTH |
| FeatureId | FEAT-SYNTHETIC-CRUD |
| Title | Synthetic API authentication and authorization |
| Priority | P0 |
| TestType | API_CONTRACT |
| TestLayer | API |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | APPROVED_BASELINE |
| ExpectedResult | Valid users authenticate; unauthenticated requests return 401; Viewer reads but cannot write; Admin writes. |
| AutomationType | AUTO |
| AutomationFramework | Playwright APIRequestContext |
