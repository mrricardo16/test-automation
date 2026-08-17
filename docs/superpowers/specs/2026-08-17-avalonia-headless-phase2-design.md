# Phase 2 Avalonia Headless Fixture Design

**Date:** 2026-08-17

**Goal:** Add an independently runnable Avalonia Headless + xUnit fixture that proves the automation repository can create a Window, inspect its control tree, exercise binding and command behavior, simulate headless input, and pass without referencing any real business project.

## Scope

This phase includes:

- A standalone .NET test project under tests/avalonia/headless.
- Target framework net8.0, reusing the existing .NET 8 SDK.
- Avalonia.Headless.XUnit 12.1.0, Avalonia.Themes.Fluent 12.1.0, xunit.v3 3.2.2, and Microsoft.NET.Test.Sdk 18.8.1, with compatible package versions.
- A code-only TestWindow containing TextBox, Button, and TextBlock.
- A small ViewModel with InputText, StatusText, and SubmitCommand.
- A single formal TestCase: TC-AVA-ENV-001.
- Assembly-level Avalonia Headless test initialization.
- A real headless test using AvaloniaFact, Window.Show, control lookup, headless text input, command/button interaction, and explicit state assertions.
- A reserved tests/avalonia/e2e directory with a boundary README only.
- AGENTS.md, README.md, .gitignore, and reports/avalonia-headless-initialization.md updates.
- Regression of npm ci, TC-WEB-ENV-001, and final Git synchronization.

This phase explicitly excludes:

- Appium, WinAppDriver, Android SDK, Java, and desktop E2E.
- Any reference to a real Avalonia business project.
- Product code changes, product-side AutomationId changes, or new testability interfaces in another repository.
- CI/CD, API automation, large-scale TestCase generation, and Phase 2B implementation.

## Deferred Phase 2B Boundary

The next sub-phase is named:

Phase 2B / Phase 2.5: Real Avalonia Project Headless Integration

It will start only after this standalone fixture passes. It must first inspect the real project's TargetFramework, Avalonia version, XAML, ViewModels, DI, resources, and service dependencies. It will classify candidate cases as directly Headless-testable, requiring a Test Double/Mock, requiring Appium E2E, or requiring manual execution. It must not modify the real business project. If product-side testability changes such as AutomationId or a seam are needed, the output will be a recommendation only.

## Version and Framework Choice

The fixture targets net8.0 even though .NET 10 is installed. This keeps the baseline on the already installed LTS-era SDK and avoids coupling the fixture to the newest local SDK. Avalonia.Headless.XUnit 12.1.0 is selected as the integration package and is kept at the same Avalonia major/minor line as Avalonia.Themes.Fluent 12.1.0. Avalonia 12 Headless uses xUnit v3, so xunit.v3 3.2.2 and Microsoft.NET.Test.Sdk 18.8.1 are selected as the test runner dependencies.

No .NET SDK installation, upgrade, global tool installation, PATH change, or system configuration change is required.

## Architecture

The fixture is intentionally code-only and has five focused components:

- AutomatedTesting.Avalonia.Headless.csproj: net8.0 project and pinned test dependencies.
- App.cs: minimal Avalonia Application with FluentTheme and the Headless test builder.
- TestWindow.cs: Window and control tree construction, with named TextBox, Button, and TextBlock.
- TestViewModel.cs: InputText, StatusText, and an ICommand implementation that copies InputText to StatusText.
- TC_AVA_ENV_001_HeadlessInteractionShouldWork.cs: the formal test linked to TC-AVA-ENV-001.

The assembly-level AvaloniaTestApplication attribute configures AppBuilder.Configure<App>().UseHeadless(new AvaloniaHeadlessPlatformOptions()). Each test uses the default per-test isolation so Application and Dispatcher state do not leak between tests.

## Interaction and Data Flow

The test flow is:

    Create TestWindow
        ↓
    Window.DataContext = TestViewModel
        ↓
    Find TextBox, Button, TextBlock by stable control name
        ↓
    Show Window in Avalonia Headless
        ↓
    Focus TextBox and inject "hello" through Headless text input
        ↓
    Two-way TextBox.Text binding updates ViewModel.InputText
        ↓
    Raise the Button click event
        ↓
    SubmitCommand copies InputText to ViewModel.StatusText
        ↓
    TextBlock.Text binding updates
        ↓
    Assert TextBlock.Text == "hello"

The test also asserts that the Window and all three controls exist before interaction. It will use AvaloniaFact so execution and awaited operations run on the Avalonia UI thread. It will not use Thread.Sleep, Task.Delay, screen coordinates, real desktop sessions, or external services.

## TestCase Contract

The TestCase record is written before the formal test:

- TestCaseId: TC-AVA-ENV-001
- Module: AVALONIA
- Title: Verify Avalonia Headless basic UI interaction capability
- Priority: P0
- TestType: Avalonia Headless
- AutomationType: AUTO
- AutomationFramework: Avalonia.Headless + xUnit
- Preconditions: .NET 8 SDK and project dependencies restore successfully
- ExpectedResult: Window and control tree initialize; input binding updates the ViewModel; SubmitCommand runs; TextBlock displays hello
- RequirementSource: Phase 2 Avalonia Headless infrastructure request

The test method name will contain TC_AVA_ENV_001 so the record and executable test are bidirectionally traceable.

## Error Handling and Evidence

A normal assertion mismatch is FAIL. Avalonia initialization failure, package restore failure, Dispatcher failure, or inability to create the Window is ERROR because the infrastructure did not complete. Missing SDK or unavailable package prerequisites are BLOCKED. The test will not catch and suppress exceptions, remove assertions, or mark itself skipped.

The dotnet test result and error output will be recorded in reports/avalonia-headless-initialization.md. bin, obj, TestResults, and other generated outputs remain ignored. No product failure is claimed because no product project is under test.

## Verification and Acceptance

The implementation is complete only when all of these are evidenced:

- TC-AVA-ENV-001 = PASS.
- TC-WEB-ENV-001 = PASS.
- npm ci = PASS.
- git diff --check = PASS.
- No Appium, WinAppDriver, Android SDK, Java, product project reference, secret, browser binary, bin, obj, or TestResults file is tracked.
- main is pushed without force.
- origin/main...HEAD = 0 0.
- The worktree is clean.
