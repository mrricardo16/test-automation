# TC-AVA-E2E-ENV-001

| Field | Value |
| --- | --- |
| TestCaseId | TC-AVA-E2E-ENV-001 |
| Module | AVALONIA_E2E_INFRASTRUCTURE |
| Title | Verify Appium Windows Driver can start and inspect the real HZ.LogClient desktop application |
| Priority | P0 |
| TestType | Appium Windows desktop environment test |
| Preconditions | Windows 10 host; project-local Appium chain and required Windows backend are installed; real executable path is read-only; no unrelated same-name product process is owned by this run |
| TestData | None; environment test only |
| Steps | Start the project-local Appium server and required Windows backend; start the real `HZ.LogClient.exe`; create a Windows Appium session; read the MainWindow page source and session window handle; close the session and only the process started by this run |
| ExpectedResult | Appium server, Windows Driver, real executable, session creation, MainWindow inspection, page-source retrieval, and cleanup all complete without coordinate interaction |
| AutomationType | AUTO |
| AutomationFramework | Appium 3 + Appium Windows Driver + WebdriverIO TypeScript |
| LocatorStrategy | Session-level app path and accessibility/page-source inspection; no coordinate locator |
| RequirementSource | Phase 3B real HZ.LogClient.exe Appium E2E minimum loop request |
| SourceCodeReference | Runtime executable `E:\logclient\logclient20260812\net8.0\HZ.LogClient.exe`; Appium Windows Driver / WinAppDriver host integration |
| Limitations | This does not prove AnalysisView navigation or log import; those belong to `TC-AVA-E2E-001` |
| Cleanup | Delete only the owned Appium session and owned HZ.LogClient process; retain user processes and product files |
| ExecutionStatus | BLOCKED |
