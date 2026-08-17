# Phase 2B / Phase 2.5 Real Avalonia Project Assessment Report

**Date:** 2026-08-17
**Assessment status:** Complete as a read-only testability assessment; no real-project Headless test was created or executed.

## Source Project

```text
Source root provided by request:
D:\HZ_RSS40\03_trunk\src_m_logclient

Actual project directory:
D:\HZ_RSS40\03_trunk\src_m_logclient\logclient

Runtime:
E:\logclient\logclient20260812\net8.0
```

The provided source root contains `HZ.LogClient.sln` and a nested `logclient` project directory, but neither the provided source root nor the nested project directory contains `.git`. The requested source Git baseline commands therefore returned `fatal: not a git repository`. No source branch or source commit exists to report.

## Automation Repository Baseline

```text
Branch: main
Initial HEAD: 4ceaa9b feat: add Avalonia headless test fixture
Remote: https://github.com/mrricardo16/test-automation.git
Initial origin/main...HEAD: 0 0
Initial worktree: clean
```

Phase 1 and Phase 2 files were present before assessment. The plan for this assessment is recorded at `docs/superpowers/plans/2026-08-17-real-avalonia-phase2b-assessment.md`.

## Source Baseline and Integrity

The source tree is not Git-managed at the provided path. A read-only aggregate SHA-256 was captured over 41 files under the actual project directory, excluding existing `bin` and `obj` outputs:

```text
Initial source-tree-integrity-baseline:
B92665F7CF9193B2E97A0C0D038D68CB235D784050EA2F2A0061402F66ED0BE8
```

Existing `bin` and `obj` directories were observed; they were not deleted, cleaned, or modified.

## Architecture

### Project and package versions

Evidence from `HZ.LogClient.csproj`:

- TargetFramework: `net8.0`
- OutputType: `WinExe`
- Avalonia: `11.3.14`
- Avalonia.Desktop: `11.3.14`
- Avalonia.Themes.Fluent: `11.3.14`
- Semi.Avalonia: `11.3.14`
- Irihi.Ursa: `1.15.1`
- Irihi.Ursa.Themes.Semi: `1.15.1`
- Newtonsoft.Json: `13.0.4`
- Existing `InternalsVisibleTo`: `HZ.LogClient.Tests`

The current independent automation fixture uses Avalonia `12.1.0`, so it is not a direct package-compatible test host for this project.

### Startup chain

`Program.Main` calls `BuildAvaloniaApp().StartWithClassicDesktopLifetime(args)`. The builder uses `AppBuilder.Configure<App>().UsePlatformDetect().LogToTrace()`.

`App.Initialize` loads `App.axaml` through `AvaloniaXamlLoader`. `App.OnFrameworkInitializationCompleted` constructs `MainWindow` for the classic desktop lifetime.

`MainWindow` immediately loads an embedded icon, reads/applies theme state, constructs and connects `AnalysisView` and `ReplayView`, and wires tab, window-state, title-bar, and keyboard behavior.

### View / ViewModel structure

The source tree contains `Views`, `Models`, and `Services`, but no dedicated `ViewModels` directory or matching ViewModel classes were found. `AnalysisView` and `ReplayView` keep state and event handlers in large code-behind classes. `MainWindow` coordinates both pages through the internal `LogClientContext` object.

There are no command properties or command bindings in the inspected XAML. User actions are primarily XAML event handlers such as `Click`, `SelectionChanged`, `TextChanged`, `DoubleTapped`, and `ValueChanged`.

### Major modules

- Log analysis: `AnalysisView`, `AnalysisQueryState`, `AnalysisTimeRange`, `LogAnalysisFilter`, `LogPackageReader`, `ImportedLogSession`.
- Analysis and reporting: `LogReportProjection`, `TaskAnalysisContext`, `TaskExecutionAnalyzer`, `MaintenanceTaskAggregator`, `LogAnalysisReportBuilder`.
- Replay: `ReplayView`, `ReplayMapCanvas`, `ReplayMapLoader`, `LogTimeAlignmentService`, replay status selectors and visual rules.
- Application shell: `App`, `MainWindow`, `ThemeManager`, custom title bar and tab switching.
- Dialog/native paths: file picker, save picker, modal windows, shell opening, fullscreen, minimize, maximize, close, and title-bar drag.

## External Dependencies and Side Effects

The source evidence identifies:

- ZIP and JSON/JSONL file reads through `LogPackageReader` and `ImportedLogSession`.
- Newtonsoft.Json parsing and report serialization.
- Avalonia resource loading from embedded and relative source assets.
- Semi.Avalonia and Ursa theme resources.
- Native storage provider file and save pickers.
- HTML report writes through `File.WriteAllTextAsync`.
- Shell opening through `Process.Start`.
- Modal dialog windows and desktop window-state operations.
- Custom Canvas/drawing and pointer-driven map interaction.

No production service, database, hardware, or device-command dependency was found in the inspected project files, but the page flows still depend on real file paths, user-selected files, resources, dialogs, and OS window behavior.

## Automation Assessment Summary

| Classification | Count | Current conclusion |
|---|---:|---|
| `AUTO_UNIT` | 3 | State, parser/session, projection/aggregation logic |
| `AUTO_HEADLESS` | 0 | No current major module is a clean direct Headless target |
| `AUTO_HEADLESS_WITH_MOCK` | 2 | AnalysisView and ReplayView with test-owned data/storage doubles |
| `NEEDS_APPIUM` | 1 | Native file/dialog/export/window integration |
| `MANUAL` | 1 | Custom map/canvas visual acceptance |
| `BLOCKED` | 1 | Current App/MainWindow direct integration path |
| `PRODUCT_CHANGE_RECOMMENDED` | 1 | Missing ViewModel/DI/service seams |

Full field-level matrix: `reports/real-avalonia-automation-assessment.md`.

## First Business Case

```text
TestCaseId: TC-AVA-LOG-001
Module: LOG_ANALYSIS
Candidate: AnalysisQueryState result-limit and pagination transitions
Recommended classification: AUTO_UNIT
Execution status in this phase: BLOCKED
```

This is a meaningful local analysis-state behavior, not a placeholder UI test. It has no external side effect and is the lowest-dependency candidate found. It is not claimed as a Headless PASS because the real assembly has not been safely connected to a test project.

Source record: `test-cases/avalonia/TC-AVA-LOG-001.md`.

## Direct Reference Decision

The real project was not directly referenced or built.

Reasons:

1. The real project targets Avalonia `11.3.14`; the existing independent fixture targets Avalonia `12.1.0`.
2. A `ProjectReference` would cause the real project build to produce or update outputs under its source directory, conflicting with the strict read-only rule.
3. The project uses relative `AvaloniaResource` inputs outside the project directory, so resource resolution must be tested only in an explicitly controlled, version-matched harness.
4. The app startup constructs the full shell and both pages, applies persisted theme state, and loads resources before a test can isolate one behavior.
5. No dedicated ViewModel/DI seam exists for replacing file, dialog, theme, and package dependencies.

Therefore no `tests/avalonia/real-project` project was created, and no real-project test result is reported as PASS, FAIL, or ERROR. The safe current result is `BLOCKED` for direct real-project Headless execution, with `PRODUCT_CHANGE_RECOMMENDED` recorded for future seams.

## Implementation Result

```text
Real-project Headless Test: NOT CREATED
Reason: safe version-matched, source-read-only assembly path was not established
Status: BLOCKED
```

No Appium or WinAppDriver installation was performed.

## Regression Results

```text
TC-AVA-ENV-001: PASS
TC-WEB-ENV-001: PASS
Appium: No, not installed
```

The existing independent fixture remains under `tests/avalonia/headless` and was not polluted with real-project references.

## Source Integrity

The source paths were only read and searched. The specified source root and nested project directory are not Git repositories, so `git status` and `git rev-parse` cannot provide a source commit comparison. The final read-only aggregate hash is recorded after all work:

```text
Final source-tree-integrity:
B92665F7CF9193B2E97A0C0D038D68CB235D784050EA2F2A0061402F66ED0BE8
```

The final hash matches the initial aggregate hash. The source root and nested project directory still have no Git metadata, so the repeated `git status`/`rev-parse` checks report `not a git repository`. No source files, source `bin`/`obj`, runtime binaries, or runtime configuration files are part of the automation repository change.
