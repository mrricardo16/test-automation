# TC-AVA-ENV-001

| Field | Value |
| --- | --- |
| TestCaseId | TC-AVA-ENV-001 |
| Module | AVALONIA |
| Title | Verify Avalonia Headless basic UI interaction capability |
| Priority | P0 |
| TestType | Avalonia Headless |
| Preconditions | .NET 8 SDK is available and the standalone test project restores successfully |
| Steps | Create the Headless Avalonia application; create TestWindow; verify Window and TextBox/Button/TextBlock control tree; focus TextBox; inject hello; focus Button; send Space key release; read TextBlock |
| ExpectedResult | Window and controls initialize; TextBox binding updates InputText; SubmitCommand executes through Button interaction; TextBlock displays hello |
| AutomationType | AUTO |
| AutomationFramework | Avalonia.Headless + xUnit |
| RequirementSource | 2026-08-17 Phase 2 Avalonia Headless infrastructure request |
| Notes | Independent fixture only. No real business project, external service, Appium, or desktop session. |
