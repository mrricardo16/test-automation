# TC-AVA-REPLAY-001

| Field | Value |
| --- | --- |
| TestCaseId | TC-AVA-REPLAY-001 |
| Module | LOG_REPLAY |
| Title | Verify a real ReplayView time-range state renders Headless controls |
| Priority | P1 |
| TestType | Real Avalonia project Headless behavior test |
| Preconditions | Real source and runtime are read-only; the compiled `HZ.LogClient.dll` is loaded without a ProjectReference; no map file, log package, native picker, timer playback, or pixel assertion is used |
| Steps | Instantiate the real `HZ.LogClient.Views.ReplayView`; attach it to a Headless Window; invoke the real time-range state transition with a 60-second range and a 10-to-40-second selection; inspect the real slider and time labels |
| ExpectedResult | The real ReplayView enables the time-range slider, sets its minimum/maximum and selected bounds, and renders non-empty start/end/range labels without external side effects |
| AutomationType | AUTO |
| AutomationClassification | AUTO_HEADLESS |
| AutomationFramework | Avalonia.Headless.XUnit 11.3.14 + xUnit 2.4.2; reflection adapter for read-only runtime DLL |
| SourceCodeReference | `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Views\ReplayView.axaml.cs`; controls `ReplayTimeRangeSlider`, `ReplayTimeRangeText`, `ReplayStartTimeText`, `ReplayEndTimeText` |
| ExecutionStatus | PASS |
| Notes | Canvas pixels remain MANUAL; file picker, native window behavior, and full replay loading are separate Appium or mock-boundary candidates. |
