# TC-AVA-ANALYSIS-002

| Field | Value |
| --- | --- |
| TestCaseId | TC-AVA-ANALYSIS-002 |
| Module | LOG_ANALYSIS |
| Title | Verify a real AnalysisView filter input invalidates the query snapshot and clears result UI state |
| Priority | P1 |
| TestType | Real Avalonia project Headless behavior test |
| Preconditions | Real source and runtime are read-only; the compiled `HZ.LogClient.dll` is loaded without a ProjectReference; no package import, picker, export, or production session is used |
| Steps | Instantiate the real `HZ.LogClient.Views.AnalysisView`; attach it to a Headless Window; set the real `TaskCodeFilter` TextBox text; inspect the real query-state snapshot, result list, and pagination border |
| ExpectedResult | The real text-change handler invalidates the query snapshot, clears the result list source, and hides pagination without throwing or touching external resources |
| AutomationType | AUTO |
| AutomationClassification | AUTO_HEADLESS |
| AutomationFramework | Avalonia.Headless.XUnit 11.3.14 + xUnit 2.4.2; reflection adapter for read-only runtime DLL |
| SourceCodeReference | `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Views\AnalysisView.axaml.cs`; controls `TaskCodeFilter`, `AnalysisRowsList`, `PaginationBorder`; state `_queryState` |
| ExecutionStatus | PASS |
| Notes | This extends beyond the existing control-tree smoke and does not duplicate `TC-AVA-LOG-001`, which tests the model state in isolation. |
