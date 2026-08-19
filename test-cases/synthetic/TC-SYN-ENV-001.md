# TC-SYN-ENV-001

| Field | Value |
|---|---|
| TestCaseId | TC-SYN-ENV-001 |
| ModuleId | MOD-SYNTHETIC-RUNTIME |
| FeatureId | SYNTHETIC_HEALTH_OWNERSHIP |
| Title | Verify the test-owned Synthetic Product runtime health and process ownership |
| Priority | P0 |
| TestType | Environment/API |
| TestLayer | RUNTIME |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | DESIGN |
| ExpectedResult | Runtime binds to dynamic 127.0.0.1 port, reports health and owned PID, then shuts down and proves that PID exited. |
| AutomationType | AUTO |
| AutomationFramework | Playwright Test + Node child_process |
