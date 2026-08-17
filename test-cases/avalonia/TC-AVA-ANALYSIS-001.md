# TC-AVA-ANALYSIS-001

| Field | Value |
| --- | --- |
| TestCaseId | TC-AVA-ANALYSIS-001 |
| Module | LOG_ANALYSIS |
| Title | Verify the real AnalysisView control tree can load in Avalonia 11.3.14 Headless |
| Priority | P1 |
| TestType | Real Avalonia project Headless control-tree smoke |
| Preconditions | Real source and runtime are read-only; the independent Harness uses Avalonia 11.3.14; no external file picker, dialog, export, or production data is invoked |
| Steps | Load the compiled read-only `HZ.LogClient.dll`; instantiate `HZ.LogClient.Views.AnalysisView`; attach it to a Headless Window; inspect the generated visual descendants; close the window |
| ExpectedResult | The real AnalysisView constructor and XAML control tree load without source build, external file access, or desktop-session side effects; representative TextBox, Button, and ListBox controls are present |
| AutomationType | AUTO |
| AutomationClassification | AUTO_HEADLESS |
| AutomationFramework | Avalonia.Headless.XUnit 11.3.14 + xUnit 2.4.2 |
| ExecutionStatus | PASS |
| SourceCodeReference | `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Views\AnalysisView.axaml`; runtime assembly `E:\logclient\logclient20260812\net8.0\HZ.LogClient.dll` |
| Notes | This is a bounded constructor/control-tree smoke. Full AnalysisView workflows remain `AUTO_HEADLESS_WITH_MOCK` candidates because storage provider, dialogs, package import, and export are directly coupled in product code. |
