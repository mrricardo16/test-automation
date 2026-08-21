# TC-SYN-CONTRACT-004

| Field | Value |
|---|---|
| TestCaseId | TC-SYN-CONTRACT-004 |
| ModuleId | MOD-SYNTHETIC-CONTRACTS |
| FeatureId | FEAT-DEFECT-FEEDBACK-SPECIALIZATION |
| Title | Verify execution Skills index defects and produce one detailed feedback record per DefectId while handoff excludes defect feedback ownership |
| Priority | P1 |
| TestType | Contract Acceptance |
| TestLayer | CONTRACT_ACCEPTANCE |
| ApplicabilityStatus | APPLICABLE |
| ExpectedBasis | APPROVED_BASELINE |
| ExpectedResult | test-execution and whitebox-test-execution require defect-list.md as an index plus a per-DefectId detailed feedback template with reproducible evidence, classification, impact, next action, and regression scope. dev-test-handoff explicitly does not generate defect feedback and assigns that responsibility to downstream execution Skills. |
| AutomationType | AUTO |
| AutomationFramework | Python static contract validators and Mock/Fake self-tests |
