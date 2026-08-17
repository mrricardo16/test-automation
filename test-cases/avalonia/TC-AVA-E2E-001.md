# TC-AVA-E2E-001

| Field | Value |
| --- | --- |
| TestCaseId | TC-AVA-E2E-001 |
| Module | ANALYSIS |
| Title | Execute the minimum real desktop log import flow in HZ.LogClient |
| Priority | P0 |
| TestType | Avalonia Desktop E2E |
| Preconditions | `TC-AVA-E2E-ENV-001` is PASS or the same prerequisites are demonstrably available; a confirmed non-sensitive parser-valid log package is configured locally; source and runtime directories are read-only |
| TestData | Local ignored `test-data/logclient/local/` package only; no production or customer log may be used or committed |
| Steps | Start the real `HZ.LogClient.exe`; connect the MainWindow; enter AnalysisView; locate the real import-log entry through accessibility tree/name/role; trigger the real Windows file picker; enter the full approved test-package path; confirm Open; wait for the real import-success state; save reviewed evidence; close only the owned process/session |
| ExpectedResult | The real import flow completes and the approved observable state appears, at minimum the selected package filename/package summary is displayed and the AnalysisView is no longer in its initial empty-import state. If the fixture contract defines a stable record count, assert that count as well. |
| AutomationType | AUTO |
| AutomationFramework | Appium 3 + Appium Windows Driver + WebdriverIO TypeScript |
| LocatorStrategy | Accessibility id if present; otherwise Name + ControlType + parent/child structure; visible text only when stable; index/coordinate are diagnostic only |
| RequirementSource | Phase 3B real HZ.LogClient.exe Appium E2E minimum loop request |
| SourceCodeReference | `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Views\AnalysisView.axaml`; runtime `E:\logclient\logclient20260812\net8.0\HZ.LogClient.exe` |
| Limitations | This MVP does not cover report export, ReplayView, map interaction, shell opening, or pixel acceptance. Missing stable locator is `ERROR_AUTOMATION_LOCATOR` plus `PRODUCT_CHANGE_RECOMMENDED`; unavailable approved data or required backend is `BLOCKED`. |
| Cleanup | Close the owned session/process; do not delete user files, test packages, product logs, or runtime files |
| ExecutionStatus | BLOCKED |
