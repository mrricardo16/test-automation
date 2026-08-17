# TC-AVA-ANALYSIS-003

| Field | Value |
| --- | --- |
| TestCaseId | TC-AVA-ANALYSIS-003 |
| Module | LOG_ANALYSIS |
| Title | Verify a real AnalysisView result-limit action updates visible business state |
| Priority | P1 |
| TestType | Real Avalonia project Headless behavior test |
| Preconditions | Real source and runtime are read-only; the compiled `HZ.LogClient.dll` is loaded without a ProjectReference; no package import, picker, export, or production session is used |
| Steps | Instantiate the real `AnalysisView`; prepare its real query-state snapshot through the reflection adapter; invoke the real result-limit click handler with the 3000 option; inspect the real query-state limit and result-limit text |
| ExpectedResult | The real view handler accepts the allowed 3000 limit, updates the real query state, and renders the corresponding visible limit text without external side effects |
| AutomationType | AUTO |
| AutomationClassification | AUTO_HEADLESS |
| AutomationFramework | Avalonia.Headless.XUnit 11.3.14 + xUnit 2.4.2; reflection adapter for read-only runtime DLL |
| SourceCodeReference | `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Views\AnalysisView.axaml.cs`; controls `ResultLimitButton`, `ResultLimitText`; state `_queryState` |
| ExecutionStatus | PASS |
| Notes | The case verifies the View-to-state transition and complements, but does not replace, `TC-AVA-LOG-001` model-level coverage. |
