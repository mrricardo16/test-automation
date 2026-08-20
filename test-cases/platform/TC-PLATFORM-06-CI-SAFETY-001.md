# TC-PLATFORM-06-CI-SAFETY-001

| Field | Value |
|---|---|
| ModuleId | MOD-PLATFORM-CI |
| FeatureId | FEAT-CI-SAFETY-GATE |
| Title | Reject unsafe CI command and workflow dependencies |
| Priority | P0 |
| TestType | PLATFORM_QUALITY_GATE |
| TestLayer | CI_STATIC |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | APPROVED_BASELINE |
| ExpectedResult | Unsafe real-project URL/path/command surfaces are rejected while the Synthetic-only CI plan is accepted. |
| AutomationType | AUTO |
| AutomationFramework | Node built-in test + YAML parser |
