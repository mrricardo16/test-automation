# TC-SYN-ERROR-001

| Field | Value |
|---|---|
| TestCaseId | TC-SYN-ERROR-001 |
| ModuleId | MOD-SYNTHETIC-RUNTIME |
| FeatureId | SYNTHETIC_CONTROLLED_ERROR |
| Title | Verify controlled server error and sanitized error response |
| Priority | P1 |
| TestType | API |
| TestLayer | BLACK_BOX_API |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | DESIGN |
| ExpectedResult | The controlled fault endpoint returns 500 with a stable non-secret error code and no stack trace or credential. |
| AutomationType | AUTO |
| AutomationFramework | Playwright APIRequestContext |
