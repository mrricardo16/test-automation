# TC-AVA-LOG-001

| Field | Value |
| --- | --- |
| TestCaseId | TC-AVA-LOG-001 |
| Module | LOG_ANALYSIS |
| Title | Verify analysis result-limit and pagination state transitions |
| Priority | P1 |
| TestType | Real Avalonia project business logic assessment |
| Preconditions | Real project source is read-only; a safe test-repository-only assembly/test path must be established before execution |
| Steps | Create analysis query state; verify allowed result limits; mark a query completed with supplied record counts; verify total pages and page navigation; invalidate the query snapshot |
| ExpectedResult | Result-limit validation, total-page calculation, page navigation, and invalidation produce deterministic expected state without UI, file, network, database, or production-service side effects |
| AutomationType | AUTO |
| AutomationFramework | xUnit unit test; real project assembly access not yet approved |
| RequirementSource | 2026-08-17 Phase 2B / Phase 2.5 real Avalonia project Headless integration assessment request |
| SourceCodeReference | View: `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Views\AnalysisView.axaml.cs`; ViewModel: none found; Command: none found; key logic: `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Models\AnalysisQueryState.cs` |
| Notes | Candidate classification: AUTO_UNIT. Execution status for this phase: BLOCKED because the real project is Avalonia 11.3.14, the independent fixture is Avalonia 12.1.0, and a ProjectReference/build would violate the read-only source boundary by writing source-project outputs. No fake PASS is recorded. |
