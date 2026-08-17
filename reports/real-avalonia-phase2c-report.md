# Phase 2C Avalonia 11.3.14 Real-Project Harness Report

**Date:** 2026-08-17
**Scope:** `Phase 2C: Avalonia 11.3.14 Real-Project Harness`
**Status:** Implemented and locally verified; source and runtime boundaries preserved

## 1. Repository and safety boundary

Automation repository:

```text
Path: E:\automated-testing
Remote: https://github.com/mrricardo16/test-automation.git
Initial branch: main
Initial HEAD: a9932ee88181b8d7f98d4950e873e557899b9dd3
Initial worktree: clean
Initial origin/main...HEAD: 0 0
```

The real source root and runtime were inspected read-only:

```text
Source root: D:\HZ_RSS40\03_trunk\src_m_logclient
Actual project: D:\HZ_RSS40\03_trunk\src_m_logclient\logclient
Runtime: E:\logclient\logclient20260812\net8.0
```

The supplied source root and nested project directory are not Git repositories. Their `git status` and `git rev-parse` checks therefore report `fatal: not a git repository`; there is no source branch or commit to compare. No source file, source `bin`/`obj`, runtime binary, or runtime configuration file was changed.

## 2. Source integrity

The same Phase 2B aggregate algorithm was used before and after: enumerate files under the actual project directory, exclude paths containing `bin` or `obj`, sort the entries case-sensitively, serialize `relative-lowercase-path|length|individual-SHA256` as UTF-8 separated by LF, and hash that manifest with SHA-256.

```text
Files excluding bin/obj: 41
Before: B92665F7CF9193B2E97A0C0D038D68CB235D784050EA2F2A0061402F66ED0BE8
After:  B92665F7CF9193B2E97A0C0D038D68CB235D784050EA2F2A0061402F66ED0BE8
Equal:  YES
```

## 3. Real-project version evidence

Read-only source evidence from `HZ.LogClient.csproj`:

| Item | Value |
|---|---|
| TargetFramework | `net8.0` |
| OutputType | `WinExe` |
| Avalonia / Desktop / Fluent | `11.3.14` |
| Semi.Avalonia | `11.3.14` |
| Irihi.Ursa / Ursa theme | `1.15.1` |
| Newtonsoft.Json | `13.0.4` |
| Existing friend assembly | `HZ.LogClient.Tests` |

Read-only runtime evidence:

| Assembly | Observed version |
|---|---:|
| `HZ.LogClient.dll` | `1.0.0.0` |
| `Avalonia.dll` | `11.3.14.0` |
| `Avalonia.Base.dll` | `11.3.14.0` |
| `Avalonia.Controls.dll` | `11.3.14.0` |
| `Semi.Avalonia.dll` | `11.3.14.0` |
| `Irihi.Ursa.dll` | `1.15.1.0` |
| `Newtonsoft.Json.dll` | `13.0.0.0` |

## 4. Harness design

The existing generic fixture remains unchanged at `tests/avalonia/headless` and keeps Avalonia `12.1.0`. The new Harness is independent:

```text
tests/avalonia/real-project/headless
  AutomatedTesting.Avalonia11.RealProject.Headless.csproj
  TC_AVA11_ENV_001_HeadlessInteractionShouldWork.cs
  TC_AVA_ANALYSIS_001_RealViewControlTreeShouldLoad.cs

tests/avalonia/real-project/unit
  AutomatedTesting.Avalonia.RealProject.Unit.csproj
  TC_AVA_LOG_001_AnalysisQueryStateShouldTransition.cs
  RuntimeAssemblyLoader.cs

config/local-projects.example.json
config/local-projects.json             ignored, machine-local only
```

The Harness contains no copied product source. `ProjectReference` is not used. The unit test uses a collectible `AssemblyLoadContext` and the Headless view smoke uses the default load context with a runtime-directory resolver so the real compiled assembly is loaded without building the product source project.

## 5. Actual NuGet package set

Headless Harness:

| Package | Version |
|---|---:|
| `Avalonia.Headless.XUnit` | `11.3.14` |
| `Avalonia.Themes.Fluent` | `11.3.14` |
| `Semi.Avalonia` | `11.3.14` |
| `Irihi.Ursa` | `1.15.1` |
| `Irihi.Ursa.Themes.Semi` | `1.15.1` |
| `Newtonsoft.Json` | `13.0.4` |
| `xunit` | `2.4.2` |
| `xunit.runner.visualstudio` | `2.8.2` |
| `Microsoft.NET.Test.Sdk` | `18.8.1` |

Unit Harness uses `xunit 2.4.2`, `xunit.runner.visualstudio 2.8.2`, and `Microsoft.NET.Test.Sdk 18.8.1`.

Compatibility evidence: the first 11.3.14 attempt with xUnit `2.9.3` reached the test runner but failed with a runner `NullReferenceException`; xUnit `2.4.2` with VS runner `2.4.5` hit a Test SDK adapter binary mismatch; the final package set above restored and passed. The old Avalonia 12.1.0 fixture was not changed.

## 6. Executed TestCases

### `TC-AVA11-ENV-001` — PASS

The independent 11.3.14 Harness validates a code-created `Window`, control tree, two-way TextBox binding, ICommand binding, Headless text input, keyboard command activation, and displayed status.

### `TC-AVA-LOG-001` — PASS

The test loads `E:\logclient\logclient20260812\net8.0\HZ.LogClient.dll` and reflects over the real internal `HZ.LogClient.Models.AnalysisQueryState`. It verifies:

- allowed and rejected result limits;
- query completion counts and abnormal-count text;
- total-page calculation and page start index;
- page navigation and compact page numbers;
- invalidation back to a non-current empty snapshot.

This is an actual real-assembly unit test, not a copied model or a test-repository reimplementation.

### `TC-AVA-ANALYSIS-001` — PASS

The test loads the real runtime assembly, constructs `HZ.LogClient.Views.AnalysisView` inside the 11.3.14 Headless application, attaches it to a Headless `Window`, and confirms representative real `TextBox`, `Button`, and `ListBox` visual descendants.

This is deliberately a bounded constructor/control-tree smoke. It does not claim coverage of file pickers, save dialogs, package import, report export, shell opening, timers, native window state, or map visual correctness.

## 7. Reference and classification decisions

| Question | Result |
|---|---|
| Real compiled DLL referenced? | Yes, read-only runtime `HZ.LogClient.dll`; loaded at runtime, not submitted |
| ProjectReference? | No |
| Real source copied into automation repo? | No |
| Existing Avalonia 12 fixture modified? | No |
| First real UI candidate | `AnalysisView` bounded control-tree smoke |
| Bounded smoke classification | `AUTO_HEADLESS` |
| Full AnalysisView workflow classification | `AUTO_HEADLESS_WITH_MOCK` candidate; not fully implemented |
| ReplayView full workflow | `AUTO_HEADLESS_WITH_MOCK` candidate; deferred |
| App/MainWindow full shell | `BLOCKED` for current safe scope |
| Native picker/dialog/export/window integration | `NEEDS_APPIUM`; Appium not installed |
| ReplayMapCanvas visual acceptance | `MANUAL` |

## 8. Product-side recommendations only

No product change was made. For a future safe full-page Headless suite, recommend:

1. introduce injectable abstractions for package/file selection, save/export, dialogs, and theme persistence;
2. move AnalysisView and ReplayView state and commands into dedicated ViewModels;
3. provide test-owned data/session seams without changing business behavior;
4. add stable AutomationId values only when the separately approved real-desktop E2E scope requires them.

These are recommendations, not Phase 2C implementation items.

## 9. Regression and completion gates

The final verification command results are recorded below after the final local run:

```text
TC-AVA-ENV-001: PASS
TC-AVA11-ENV-001: PASS
TC-AVA-LOG-001: PASS
TC-AVA-ANALYSIS-001: PASS
TC-WEB-ENV-001: PASS
npm ci: PASS
git diff --check: PASS
Appium: No, not installed
```

## 10. Git publication

The final commit and remote synchronization are recorded in the closing section of this report after publication:

```text
Implementation commit: 1bfef41 feat: add Avalonia 11 real-project harness
Publication commit: recorded by the follow-up report commit below
Push: origin/main updated successfully
origin/main...HEAD: 0 0
```

## 11. Boundary after Phase 2C

Stop here. The next separately approved stage is `Phase 2D / Phase 2.5B`: expand real AnalysisView/ReplayView workflows with test-owned doubles, then define the minimal Appium scope for native desktop behavior. Do not install Appium, modify the real product, or start CI/CD as part of this Phase 2C closeout.
