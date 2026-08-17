# TC-AVA-LOG-001

| Field | Value |
| --- | --- |
| TestCaseId | TC-AVA-LOG-001 |
| Module | LOG_ANALYSIS |
| Title | Verify analysis result-limit and pagination state transitions |
| Priority | P1 |
| TestType | Real Avalonia project business logic assessment |
| Preconditions | Real project source and runtime are read-only; the test loads the compiled runtime assembly through the test repository's isolated loader |
| Steps | Create analysis query state; verify allowed result limits; mark a query completed with supplied record counts; verify total pages and page navigation; invalidate the query snapshot |
| ExpectedResult | Result-limit validation, total-page calculation, page navigation, and invalidation produce deterministic expected state without UI, file, network, database, or production-service side effects |
| AutomationType | AUTO |
| AutomationFramework | xUnit 2.4.2 unit test; runtime DLL reflection loader |
| RequirementSource | 2026-08-17 Phase 2C real Avalonia 11.3.14 real-project Harness request |
| SourceCodeReference | View: `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Views\AnalysisView.axaml.cs`; ViewModel: none found; Command: none found; key logic: `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Models\AnalysisQueryState.cs` |
| ExecutionStatus | PASS |
| Notes | `AnalysisQueryState` was exercised from the read-only `HZ.LogClient.dll` under `E:\logclient\logclient20260812\net8.0`. No ProjectReference, source build, source copy, or runtime modification was used. |
